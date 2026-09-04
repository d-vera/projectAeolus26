#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <Wire.h>
#include <ArduinoJson.h>
#include <LittleFS.h>
#include <Adafruit_PM25AQI.h>
#include <SensirionI2cScd4x.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SH110X.h>
#include <deque>
#include "time.h"

// ==================================================
// PINES Y CONFIGURACIÓN HARDWARE
// ==================================================
#define SDA_PIN 21
#define SCL_PIN 22
#define BUTTON_PIN 13

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET    -1
#define OLED_ADDRESS  0x3C

// ==================================================
// CONFIGURACIÓN DE RED Y MQTT
// ==================================================
const char* ssid = "miwifi";
const char* password = "1234567";

const char* mqttServer = "b58901c6.ala.us-east-1.emqxsl.com";
const int mqttPort = 8883;
const char* mqttUser = "userNode1";
const char* mqttPassword = "cqVC$#234";
const char* mqttTopic = "calidad_aire/nodo1";

// ==================================================
// ESTRUCTURA DE DATOS INTER-TAREAS (FreeRTOS)
// ==================================================
struct DatosLectura {
    uint16_t co2 = 0;
    float temperatura = 0.0;
    float humedad = 0.0;
    uint16_t pm1 = 0;
    uint16_t pm25 = 0;
    uint16_t pm10 = 0;
    uint16_t particulas03 = 0;
    uint8_t estadoSCD41 = 1;      // 0: OK, 1: NO DETECTADO, 2: ERROR, 3: TIMEOUT
    uint8_t estadoPMSA003I = 1;
    time_t timestamp = 0;
    uint32_t secuencia = 0;
    size_t tamañoCola = 0;
    bool wifiConectado = false;
};

// Primitive Handles de FreeRTOS
QueueHandle_t colaFreeRTOS;
SemaphoreHandle_t mutexI2C;

// Objetos Globales
Adafruit_PM25AQI pmsa;
SensirionI2cScd4x scd4x;
Adafruit_SH1106G display = Adafruit_SH1106G(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

String chipID;
const char* nombreNodo = "Node1";
const char* firmwareVersion = "3.2.2-FixCadenciaWiFi";

// Control OLED
bool oledEncendido = false;
unsigned long tiempoEncendidoOLED = 0;
const uint32_t duracionOLED = 10000; // 10 segundos activo
unsigned long ultimoDebounce = 0;

// Variable compartida para reflejar el tamaño de cola en pantalla
volatile size_t tamanoColaGlobal = 0;

// ==================================================
// TRADUCTOR DE ESTADO DE SENSORES
// ==================================================
String obtenerTextoEstado(uint8_t estado) {
    switch (estado) {
        case 0: return "OK";
        case 1: return "NO DETECTADO";
        case 2: return "ERR LECTURA";
        case 3: return "TIMEOUT";
        default: return "DESCONOCIDO";
    }
}

// ==================================================
// CONTROL PANTALLA OLED
// ==================================================
void apagarOLED() {
    if (xSemaphoreTake(mutexI2C, pdMS_TO_TICKS(100)) == pdTRUE) {
        display.oled_command(SH110X_DISPLAYOFF);
        xSemaphoreGive(mutexI2C);
    }
    oledEncendido = false;
}

void encenderOLED() {
    if (xSemaphoreTake(mutexI2C, pdMS_TO_TICKS(100)) == pdTRUE) {
        display.oled_command(SH110X_DISPLAYON);
        xSemaphoreGive(mutexI2C);
    }
    oledEncendido = true;
    tiempoEncendidoOLED = millis();
}

void actualizarOLED(const DatosLectura& d) {
    if (!oledEncendido) return;

    if (xSemaphoreTake(mutexI2C, pdMS_TO_TICKS(200)) == pdTRUE) {
        display.clearDisplay();
        display.setTextSize(1);
        display.setTextColor(SH110X_WHITE);

        // 1. Estado WiFi (Y = 0)
        display.setCursor(0, 0);
        display.print("WiFi: ");
        if (d.wifiConectado) {
            display.println("CONECTADO");
        } else {
            display.println("DESCONECTADO");
        }

        // 2. Secuencia de envío (Y = 16)
        display.setCursor(0, 16);
        display.print("Secuencia: #");
        display.println(d.secuencia);

        // 3. Cola de almacenamiento acumulada (Y = 28)
        display.setCursor(0, 28);
        display.print("Pendientes: ");
        display.print(tamanoColaGlobal);
        display.println(" msgs");

        // 4. Estado Sensores (Y = 40)
        display.setCursor(0, 40);
        display.print("SCD41:");
        display.println(obtenerTextoEstado(d.estadoSCD41));

        display.setCursor(0, 52);
        display.print("PMSA003I:");
        display.print(obtenerTextoEstado(d.estadoPMSA003I));

        display.display();
        xSemaphoreGive(mutexI2C);
    }
}

// ==================================================
// TAREA 1: SENSORES, PANTALLA Y BOTÓN (CORE 1)
// ==================================================
void tareaSensores(void *pvParameters) {
    Wire.begin(SDA_PIN, SCL_PIN);
    Wire.setClock(100000);

    if (xSemaphoreTake(mutexI2C, portMAX_DELAY) == pdTRUE) {
        if (display.begin(OLED_ADDRESS, true)) {
            display.clearDisplay();
            display.display();
            display.oled_command(SH110X_DISPLAYOFF);
            oledEncendido = false;
        }

        // Inicializar SCD41
        scd4x.begin(Wire, 0x62);
        scd4x.stopPeriodicMeasurement();
        vTaskDelay(pdMS_TO_TICKS(500));
        scd4x.startPeriodicMeasurement();

        // Inicializar PMSA003I
        pmsa.begin_I2C(&Wire);

        xSemaphoreGive(mutexI2C);
    }

    vTaskDelay(pdMS_TO_TICKS(3000));

    DatosLectura datos = {};
    uint32_t secuenciaLocal = 0;
    unsigned long ultimoCicloLectura = 0;

    for (;;) {
        // 1. Lectura del botón con Debounce
        if (digitalRead(BUTTON_PIN) == LOW && (millis() - ultimoDebounce > 250)) {
            ultimoDebounce = millis();
            if (!oledEncendido) {
                encenderOLED();
            } else {
                tiempoEncendidoOLED = millis();
            }
            actualizarOLED(datos);
        }

        // 2. Temporizador de apagar OLED
        if (oledEncendido && (millis() - tiempoEncendidoOLED >= duracionOLED)) {
            apagarOLED();
        }

        // 3. Muestreo continuo cada 15 segundos
        if (millis() - ultimoCicloLectura >= 15000 || ultimoCicloLectura == 0) {
            ultimoCicloLectura = millis();

            datos.secuencia = ++secuenciaLocal;
            datos.timestamp = time(nullptr);
            datos.wifiConectado = (WiFi.status() == WL_CONNECTED);

            if (xSemaphoreTake(mutexI2C, pdMS_TO_TICKS(1000)) == pdTRUE) {
                
                // Lectura SCD41
                bool listo = false;
                uint16_t errorStatus = scd4x.getDataReadyStatus(listo);
                
                if (errorStatus == 0 && !listo) {
                    vTaskDelay(pdMS_TO_TICKS(500));
                    errorStatus = scd4x.getDataReadyStatus(listo);
                }

                if (errorStatus == 0 && listo) {
                    uint16_t errorRead = scd4x.readMeasurement(datos.co2, datos.temperatura, datos.humedad);
                    if (errorRead == 0 && datos.co2 > 0) {
                        datos.estadoSCD41 = 0; 
                    } else {
                        datos.estadoSCD41 = 2; 
                    }
                } else if (errorStatus != 0) {
                    datos.estadoSCD41 = 2; 
                } else {
                    datos.estadoSCD41 = 3; 
                }

                // Lectura PMSA003I
                PM25_AQI_Data datosPM;
                if (pmsa.read(&datosPM)) {
                    datos.pm1 = datosPM.pm10_standard;
                    datos.pm25 = datosPM.pm25_standard;
                    datos.pm10 = datosPM.pm100_standard;
                    datos.particulas03 = datosPM.particles_03um;
                    datos.estadoPMSA003I = 0; 
                } else {
                    datos.estadoPMSA003I = 2; 
                }

                xSemaphoreGive(mutexI2C);
            }

            actualizarOLED(datos);

            // Se envía el mensaje a la cola para ser procesado por comunicaciones
            xQueueSend(colaFreeRTOS, &datos, 0);
        }

        vTaskDelay(pdMS_TO_TICKS(50));
    }
}

// ==================================================
// TAREA 2: CONEXIÓN Y ALMACENAMIENTO (CORE 0)
// ==================================================
void tareaComunicaciones(void *pvParameters) {
    WiFiClientSecure espClient;
    PubSubClient mqtt(espClient);
    JsonDocument doc;
    
    std::deque<String> colaRAM;
    const size_t MAX_RAM_MESSAGES = 100;
    const char* colaPath = "/cola_offline.txt";
    char payload[768];

    LittleFS.begin(true);

    if (LittleFS.exists(colaPath)) {
        File archivo = LittleFS.open(colaPath, "r");
        if (archivo) {
            while (archivo.available() && colaRAM.size() < MAX_RAM_MESSAGES) {
                String linea = archivo.readStringUntil('\n');
                linea.trim();
                if (linea.length() > 5) colaRAM.push_back(linea);
            }
            archivo.close();
            LittleFS.remove(colaPath);
        }
    }

    WiFi.mode(WIFI_STA);
    WiFi.setAutoReconnect(true); // Habilita autorreconexión automática a nivel de driver
    WiFi.begin(ssid, password);
    
    configTime(-4 * 3600, 0, "pool.ntp.org", "time.nist.gov");

    espClient.setInsecure();
    mqtt.setBufferSize(1024);
    mqtt.setServer(mqttServer, mqttPort);

    DatosLectura datosRecibidos;
    unsigned long ultimoIntentoWiFi = 0;
    unsigned long ultimoIntentoMQTT = 0;
    unsigned long ultimoEnvioCola = 0;

    for (;;) {
        // --- 1. GESTIÓN REFORZADA DE RECONEXIÓN WI-FI ---
        if (WiFi.status() != WL_CONNECTED) {
            if (millis() - ultimoIntentoWiFi >= 10000) {
                ultimoIntentoWiFi = millis();
                WiFi.disconnect();
                WiFi.reconnect();
            }
        } else {
            // --- 2. GESTIÓN DE CONEXIÓN MQTT ---
            if (!mqtt.connected()) {
                if (millis() - ultimoIntentoMQTT >= 5000) {
                    ultimoIntentoMQTT = millis();
                    mqtt.connect(chipID.c_str(), mqttUser, mqttPassword);
                }
            } else {
                mqtt.loop();
            }
        }

        // --- 3. RECEPCIÓN DE MEDICIÓNS DESDE CORE 1 ---
        if (xQueueReceive(colaFreeRTOS, &datosRecibidos, 0) == pdTRUE) {
            doc.clear();
            JsonObject dispositivo = doc["dispositivo"].to<JsonObject>();
            dispositivo["id"] = chipID;
            dispositivo["firmware"] = firmwareVersion;
            dispositivo["secuencia"] = datosRecibidos.secuencia;
            dispositivo["timestamp"] = datosRecibidos.timestamp;

            JsonObject estado = doc["estado"].to<JsonObject>();
            estado["scd41"] = datosRecibidos.estadoSCD41;
            estado["pmsa003i"] = datosRecibidos.estadoPMSA003I;

            JsonObject entorno = doc["entorno"].to<JsonObject>();
            entorno["temperatura"] = datosRecibidos.temperatura;
            entorno["humedad"] = datosRecibidos.humedad;

            JsonObject aire = doc["aire"].to<JsonObject>();
            aire["co2"] = datosRecibidos.co2;
            aire["pm1_0"] = datosRecibidos.pm1;
            aire["pm2_5"] = datosRecibidos.pm25;
            aire["pm10"] = datosRecibidos.pm10;
            aire["particulas03"] = datosRecibidos.particulas03;

            serializeJson(doc, payload);

            if (colaRAM.size() >= MAX_RAM_MESSAGES) {
                File archivo = LittleFS.open(colaPath, "a");
                if (archivo) {
                    archivo.println(payload);
                    archivo.close();
                }
            } else {
                colaRAM.push_back(String(payload));
            }

            tamanoColaGlobal = colaRAM.size();
        }

        // --- 4. ENVÍO DOSIFICADO DE COLA (CADA 3 SEGUNDOS) ---
        if (mqtt.connected() && !colaRAM.empty()) {
            if (millis() - ultimoEnvioCola >= 3000) {
                ultimoEnvioCola = millis();
                String medicion = colaRAM.front();
                if (mqtt.publish(mqttTopic, medicion.c_str())) {
                    colaRAM.pop_front();
                    tamanoColaGlobal = colaRAM.size();
                }
            }
        }

        vTaskDelay(pdMS_TO_TICKS(50));
    }
}

// ==================================================
// SETUP / LOOP
// ==================================================
void setup() {
    Serial.begin(115200);
    pinMode(BUTTON_PIN, INPUT_PULLUP);

    uint64_t chipid = ESP.getEfuseMac();
    char id[17];
    sprintf(id, "%04X%08X", (uint16_t)(chipid >> 32), (uint32_t)chipid);
    chipID = String(id);

    mutexI2C = xSemaphoreCreateMutex();
    colaFreeRTOS = xQueueCreate(10, sizeof(DatosLectura));

    xTaskCreatePinnedToCore(tareaSensores, "Sensores", 4096, NULL, 2, NULL, 1);
    xTaskCreatePinnedToCore(tareaComunicaciones, "Comunicaciones", 8192, NULL, 1, NULL, 0);
}

void loop() {
    vTaskDelete(NULL);
}
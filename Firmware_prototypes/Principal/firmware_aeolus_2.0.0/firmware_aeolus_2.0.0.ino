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
    uint16_t co2;
    float temperatura;
    float humedad;
    uint16_t pm1;
    uint16_t pm25;
    uint16_t pm10;
    uint16_t particulas03;
    uint8_t estadoSCD41;
    uint8_t estadoPMSA003I;
    time_t timestamp;
    uint32_t secuencia;
    size_t tamañoCola;
    bool wifiConectado;
};

// Queue de FreeRTOS para pasar datos entre el Core 1 y el Core 0
QueueHandle_t colaFreeRTOS;

// Globales compartidas en el Core 1
Adafruit_PM25AQI pmsa;
SensirionI2cScd4x scd4x;
Adafruit_SH1106G display = Adafruit_SH1106G(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

String chipID;
const char* nombreNodo = "Node1";
const char* firmwareVersion = "3.2.0-CustomOLED";

// Control OLED
bool oledEncendido = false;
unsigned long tiempoEncendidoOLED = 0;
const uint32_t duracionOLED = 10000; // 10 segundos activo
unsigned long ultimoDebounce = 0;

// ==================================================
// TRADUCTOR DE ESTADO DE SENSORES
// ==================================================
String obtenerTextoEstado(uint8_t estado) {
    switch (estado) {
        case 0: return "OK";
        case 1: return "NO DETECTADO";
        case 2: return "ERROR LECTURA";
        case 3: return "TIMEOUT";
        default: return "DESCONOCIDO";
    }
}

// ==================================================
// CONTROL PANTALLA OLED (PERSONALIZADA)
// ==================================================
void apagarOLED() {
    display.oled_command(SH110X_DISPLAYOFF);
    oledEncendido = false;
}

void encenderOLED() {
    display.oled_command(SH110X_DISPLAYON);
    oledEncendido = true;
    tiempoEncendidoOLED = millis();
}

void actualizarOLED(const DatosLectura& d) {
    if (!oledEncendido) return;

    display.clearDisplay();
    display.setTextSize(1);

    // Header invertido (Fondo blanco con texto negro)
    //display.fillRect(0, 0, 128, 12, SH110X_WHITE);
    //display.setTextColor(SH110X_BLACK, SH110X_WHITE);
    //display.setCursor(8, 2);
    //display.println("ESTADO DEL NODO");

    // Texto normal para el resto del contenido
    display.setTextColor(SH110X_WHITE);

    // 1. Estado WiFi
    display.setCursor(0, 16);
    display.print("WiFi: ");
    if (d.wifiConectado) {
        display.println("CONECTADO");
    } else {
        display.println("DESCONECTADO");
    }

    // 2. Secuencia de envío
    display.setCursor(0, 28);
    display.print("Secuencia: #");
    display.println(d.secuencia);

    // 3. Cola de almacenamiento acumulada
    display.setCursor(0, 40);
    display.print("Cola FIFO: ");
    display.print(d.tamañoCola);
    display.println(" msgs");

    // 4. Estado Sensores (Línea final)
    display.setCursor(0, 52);
    display.print("SCD:");
    display.println(obtenerTextoEstado(d.estadoSCD41));
    
    display.setCursor(68, 52);
    display.print("PMS:");
    display.print(obtenerTextoEstado(d.estadoPMSA003I));

    display.display();
}

// ==================================================
// TAREA 1: SENSORES, PANTALLA Y BOTÓN (CORE 1)
// ==================================================
void tareaSensores(void *pvParameters) {
    Wire.begin(SDA_PIN, SCL_PIN);
    Wire.setClock(100000);

    if (display.begin(OLED_ADDRESS, true)) {
        display.clearDisplay();
        display.display();
        apagarOLED();
    }

    scd4x.begin(Wire, 0x62);
    scd4x.stopPeriodicMeasurement();
    vTaskDelay(pdMS_TO_TICKS(100));
    scd4x.startPeriodicMeasurement();

    pmsa.begin_I2C(&Wire);

    DatosLectura datos = {};
    uint32_t secuenciaLocal = 0;
    unsigned long ultimoCicloLectura = 0;

    for (;;) {
        // 1. Lectura del botón
        if (digitalRead(BUTTON_PIN) == LOW && (millis() - ultimoDebounce > 200)) {
            ultimoDebounce = millis();
            encenderOLED();
            actualizarOLED(datos);
        }

        // 2. Temporizador de apagar OLED
        if (oledEncendido && (millis() - tiempoEncendidoOLED >= duracionOLED)) {
            apagarOLED();
        }

        // 3. Muestreo cada 15 segundos
        if (millis() - ultimoCicloLectura >= 15000 || ultimoCicloLectura == 0) {
            ultimoCicloLectura = millis();

            datos.secuencia = ++secuenciaLocal;
            datos.timestamp = time(nullptr);
            datos.wifiConectado = (WiFi.status() == WL_CONNECTED);

            // Lectura SCD41
            bool listo = false;
            if (!scd4x.getDataReadyStatus(listo) && listo) {
                if (!scd4x.readMeasurement(datos.co2, datos.temperatura, datos.humedad)) {
                    datos.estadoSCD41 = 0; // OK
                } else { datos.estadoSCD41 = 2; }
            } else { datos.estadoSCD41 = 3; }

            // Lectura PMSA003I
            PM25_AQI_Data datosPM;
            if (pmsa.read(&datosPM)) {
                datos.pm1 = datosPM.pm10_standard;
                datos.pm25 = datosPM.pm25_standard;
                datos.pm10 = datosPM.pm100_standard;
                datos.particulas03 = datosPM.particles_03um;
                datos.estadoPMSA003I = 0; // OK
            } else { datos.estadoPMSA003I = 2; }

            // Actualiza la pantalla personalizada
            actualizarOLED(datos);

            // Envía datos al Core 0
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
    WiFi.begin(ssid, password);
    configTime(-4 * 3600, 0, "pool.ntp.org", "time.nist.gov");

    espClient.setInsecure();
    mqtt.setBufferSize(1024);
    mqtt.setServer(mqttServer, mqttPort);

    DatosLectura datosRecibidos;
    unsigned long ultimoIntentoMQTT = 0;

    for (;;) {
        if (WiFi.status() == WL_CONNECTED) {
            if (!mqtt.connected()) {
                if (millis() - ultimoIntentoMQTT >= 5000) {
                    ultimoIntentoMQTT = millis();
                    mqtt.connect(chipID.c_str(), mqttUser, mqttPassword);
                }
            } else {
                mqtt.loop();
            }
        }

        if (xQueueReceive(colaFreeRTOS, &datosRecibidos, 0) == pdTRUE) {
            // Actualizar tamaño actual de la cola para reflejarlo en la pantalla
            datosRecibidos.tamañoCola = colaRAM.size();

            doc.clear();
            JsonObject dispositivo = doc["dispositivo"].to<JsonObject>();
            dispositivo["id"] = chipID;
            dispositivo["nombre"] = nombreNodo;
            dispositivo["firmware"] = firmwareVersion;
            dispositivo["secuencia"] = datosRecibidos.secuencia;
            dispositivo["timestamp"] = datosRecibidos.timestamp;
            dispositivo["cola"] = datosRecibidos.tamañoCola;

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
                    while (!colaRAM.empty()) {
                        archivo.println(colaRAM.front());
                        colaRAM.pop_front();
                    }
                    archivo.close();
                }
            }

            colaRAM.push_back(String(payload));
        }

        if (mqtt.connected() && !colaRAM.empty()) {
            String medicion = colaRAM.front();
            if (mqtt.publish(mqttTopic, medicion.c_str())) {
                colaRAM.pop_front();
            }
        }

        vTaskDelay(pdMS_TO_TICKS(100));
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

    colaFreeRTOS = xQueueCreate(10, sizeof(DatosLectura));

    xTaskCreatePinnedToCore(tareaSensores, "Sensores", 4096, NULL, 2, NULL, 1);
    xTaskCreatePinnedToCore(tareaComunicaciones, "Comunicaciones", 8192, NULL, 1, NULL, 0);
}

void loop() {
    vTaskDelete(NULL);
}
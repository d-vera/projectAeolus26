#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <Wire.h>
#include <ArduinoJson.h>
#include <LittleFS.h>
#include <Adafruit_PM25AQI.h>
#include <SensirionI2cScd4x.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SH110X.h> // Librería unificada para pantallas SH1106/SH110X
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
const char* password = "12345678";

const char* mqttServer = "b58901c6.ala.us-east-1.emqxsl.com";
const int mqttPort = 8883;
const char* mqttUser = "Node1";
const char* mqttPassword = "12345678";
const char* mqttTopic = "MedicionAire/nodo1";

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
};

// Queue de FreeRTOS para pasar datos entre el Core 1 y el Core 0
QueueHandle_t colaFreeRTOS;

// Globales compartidas en el Core 1
Adafruit_PM25AQI pmsa;
SensirionI2cScd4x scd4x;
Adafruit_SH1106G display = Adafruit_SH1106G(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

String chipID;
const char* nombreNodo = "Node1";
const char* firmwareVersion = "3.1.0-SH1106-FreeRTOS";

// Control OLED
bool oledEncendido = false;
unsigned long tiempoEncendidoOLED = 0;
const uint32_t duracionOLED = 10000; // 10 segundos activo
unsigned long ultimoDebounce = 0;

// ==================================================
// CONTROL PANTALLA OLED (SH1106)
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
    display.setTextColor(SH110X_WHITE);

    display.setCursor(0, 0);
    display.println("--- CALIDAD DE AIRE ---");

    display.setCursor(0, 16);
    display.print("CO2:   "); display.print(d.co2); display.println(" ppm");

    display.setCursor(0, 28);
    display.print("Temp:  "); display.print(d.temperatura, 1); display.println(" C");

    display.setCursor(0, 40);
    display.print("Hum:   "); display.print(d.humedad, 1); display.println(" %");

    display.setCursor(0, 52);
    display.print("PM2.5: "); display.print(d.pm25); display.println(" ug/m3");

    display.display();
}

// ==================================================
// TAREA 1: SENSORES, PANTALLA Y BOTÓN (CORE 1)
// ==================================================
void tareaSensores(void *pvParameters) {
    Wire.begin(SDA_PIN, SCL_PIN);
    Wire.setClock(100000); // 100 kHz estable

    // Inicializar Pantalla SH1106
    if (display.begin(OLED_ADDRESS, true)) {
        display.clearDisplay();
        display.display();
        apagarOLED();
    }

    // Inicializar Sensores
    scd4x.begin(Wire, 0x62);
    scd4x.stopPeriodicMeasurement();
    vTaskDelay(pdMS_TO_TICKS(100));
    scd4x.startPeriodicMeasurement();

    pmsa.begin_I2C(&Wire);

    DatosLectura datos = {};
    uint32_t secuenciaLocal = 0;
    unsigned long ultimoCicloLectura = 0;

    for (;;) {
        // 1. Verificación continua del Pulsador (revisa cada 50ms)
        if (digitalRead(BUTTON_PIN) == LOW && (millis() - ultimoDebounce > 200)) {
            ultimoDebounce = millis();
            encenderOLED();
            actualizarOLED(datos);
        }

        // 2. Control del apagado automático de la pantalla
        if (oledEncendido && (millis() - tiempoEncendidoOLED >= duracionOLED)) {
            apagarOLED();
        }

        // 3. Tomar mediciones cada 15 segundos (sin bloquear el botón)
        if (millis() - ultimoCicloLectura >= 15000 || ultimoCicloLectura == 0) {
            ultimoCicloLectura = millis();

            datos.secuencia = ++secuenciaLocal;
            datos.timestamp = time(nullptr);

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

            // Actualizar la pantalla si está encendida
            actualizarOLED(datos);

            // Transferir datos a Core 0 sin bloqueo
            xQueueSend(colaFreeRTOS, &datos, 0);
        }

        vTaskDelay(pdMS_TO_TICKS(50)); // Libera el procesador brevemente
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

    // Inicializar Sistema de Archivos LittleFS
    LittleFS.begin(true);

    // Cargar pendientes de Flash a la RAM si existen
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
        // 1. Gestión Conexión WiFi
        if (WiFi.status() == WL_CONNECTED) {
            // Gestión Conexión MQTT
            if (!mqtt.connected()) {
                if (millis() - ultimoIntentoMQTT >= 5000) {
                    ultimoIntentoMQTT = millis();
                    mqtt.connect(chipID.c_str(), mqttUser, mqttPassword);
                }
            } else {
                mqtt.loop();
            }
        }

        // 2. Comprobar si hay nuevas lecturas provenientes de Core 1
        if (xQueueReceive(colaFreeRTOS, &datosRecibidos, 0) == pdTRUE) {
            doc.clear();

            JsonObject dispositivo = doc["dispositivo"].to<JsonObject>();
            dispositivo["id"] = chipID;
            dispositivo["nombre"] = nombreNodo;
            dispositivo["firmware"] = firmwareVersion;
            dispositivo["secuencia"] = datosRecibidos.secuencia;
            dispositivo["timestamp"] = datosRecibidos.timestamp;
            dispositivo["cola"] = colaRAM.size();

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

            // Respaldar a Flash si la RAM se llena
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

        // 3. Procesar y publicar la cola en orden estricto FIFO
        if (mqtt.connected() && !colaRAM.empty()) {
            String medicion = colaRAM.front();
            if (mqtt.publish(mqttTopic, medicion.c_str())) {
                colaRAM.pop_front(); // Se remueve solo cuando fue confirmado por el Broker
            }
        }

        vTaskDelay(pdMS_TO_TICKS(100)); // Mantener activo el Watchdog del Core 0
    }
}

// ==================================================
// SETUP / LOOP
// ==================================================
void setup() {
    Serial.begin(115200);
    pinMode(BUTTON_PIN, INPUT_PULLUP);

    // Formatear Chip ID
    uint64_t chipid = ESP.getEfuseMac();
    char id[17];
    sprintf(id, "%04X%08X", (uint16_t)(chipid >> 32), (uint32_t)chipid);
    chipID = String(id);

    // Crear cola inter-procesos (capacidad de 10 estructuras)
    colaFreeRTOS = xQueueCreate(10, sizeof(DatosLectura));

    // Crear Tarea 1 en CORE 1 (Sensores, Pantalla, Botón)
    xTaskCreatePinnedToCore(
        tareaSensores,
        "Sensores",
        4096,
        NULL,
        2, // Prioridad Alta
        NULL,
        1  // Core 1
    );

    // Crear Tarea 2 en CORE 0 (Red, MQTT, Flash)
    xTaskCreatePinnedToCore(
        tareaComunicaciones,
        "Comunicaciones",
        8192,
        NULL,
        1, // Prioridad Media
        NULL,
        0  // Core 0
    );
}

void loop() {
    // El loop principal se elimina para dejar libre a los planificadores de FreeRTOS
    vTaskDelete(NULL);
}
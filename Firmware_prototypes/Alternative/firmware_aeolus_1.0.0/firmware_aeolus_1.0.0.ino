#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>

#include <Wire.h>

#include <ArduinoJson.h>

#include <LittleFS.h>

#include <Adafruit_PM25AQI.h>

#include <SensirionI2cScd4x.h>

#include "time.h"

// Pines
#define SDA_PIN     21
#define SCL_PIN     22

// WiFi
const char* ssid = "miwifi";
const char* password = "1234567";

// MQTT
const char* mqttServer ="b58901c6.ala.us-east-1.emqxsl.com";
const int mqttPort = 8883;
const char* mqttUser = "userNode1";
const char* mqttPassword = "cqVC$#234";
const char* mqttTopic ="calidad_aire/nodo1";

// Tamaño de buffer MQTT (el default de PubSubClient es 256 bytes,
// insuficiente para nuestro JSON de hasta 768 bytes)
const uint16_t mqttBufferSize = 1024;

// Objetos globales
WiFiClientSecure espClient;
PubSubClient mqtt(espClient);
Adafruit_PM25AQI pmsa;
SensirionI2cScd4x scd4x;
JsonDocument doc;

// Variables globales
// Identificación del nodo
String chipID;
String nombreNodo = "Node1";
const char* firmwareVersion = "2.1.0";

// Estado de sensores
enum EstadoSensor
{
    SENSOR_OK = 0,
    SENSOR_NO_DETECTADO = 1,
    SENSOR_ERROR_LECTURA = 2,
    SENSOR_TIMEOUT = 3
};

uint8_t estadoSCD41 = SENSOR_NO_DETECTADO;
uint8_t estadoPMSA003I = SENSOR_NO_DETECTADO;

PM25_AQI_Data datosPM;

// Variables de medición de sensores
float temperatura = 0;
float humedad = 0;
uint16_t co2 = 0;
uint16_t pm1 = 0;
uint16_t pm25 = 0;
uint16_t pm10 = 0;
uint16_t particulas03 = 0;

// Comunicacion con oled
bool wifiOK = false;
bool mqttOK = false;

// Cola Offline
bool offline = false;
uint16_t colaPendiente = 0;
const char* colaPath = "/cola.txt";
const char* colaTmpPath = "/cola_tmp.txt";

// Tiempo
time_t timestamp = 0;
uint32_t sequence = 0;

// Publicacion
unsigned long previousPublish = 0;
const uint32_t publishInterval = 15000;
unsigned long previousRecovery = 0;
const uint32_t recoveryInterval = 3000;

// JSON
char payload[768];

void setup()
{
    Serial.begin(115200);
    delay(1000);

    Serial.println();
    Serial.println("========================");
    Serial.println("Firmware 2.1.0");
    Serial.println("========================");
    
    chipID = obtenerChipID();

    iniciarI2C();
    iniciarSCD41();
    iniciarPMSA003I();

    conectarWiFi();

    configTime(
        -4 * 3600,
        0,
        "pool.ntp.org",
        "time.nist.gov"
    );
    delay(3000);

    iniciarLittleFS();

    espClient.setInsecure();

    // Ampliamos el buffer de PubSubClient (default 256 bytes,
    // insuficiente para nuestro JSON de hasta 768 bytes)
    mqtt.setBufferSize(mqttBufferSize);
    mqtt.setServer(mqttServer, mqttPort);

    conectarMQTT();
}

void loop()
{
    verificarWiFi();
    verificarMQTT();
    mqtt.loop();

    unsigned long ahora = millis();

    // Reenvío de datos guardados durante cortes de conexión
    if (ahora - previousRecovery >= recoveryInterval)
    {
        previousRecovery = ahora;
        procesarCola();
    }

    if (ahora - previousPublish >= publishInterval)
    {
        previousPublish = ahora;
        leerSensores();
        imprimirSensores();
        publicarMedicion();
    }
}

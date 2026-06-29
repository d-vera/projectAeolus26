//version 1.0.2 
#include <WiFi.h> 
#include <WiFiClientSecure.h> 
#include <PubSubClient.h> 
#include <Wire.h> 
#include <Adafruit_Sensor.h> 
#include <Adafruit_BME280.h> 
#include <ArduinoJson.h> 
#include "time.h" 
// BME280 
#define SDA_PIN 21 
#define SCL_PIN 22 
// MQ135 
#define MQ135_PIN 35 
// GP2Y1010 
#define GP_LED 4 
#define GP_OUTPUT 34 
// WiFi 
const char* ssid = "miwifi"; 
const char* password = "mipassword"; 
// MQTT 
const char* mqttServer = "b58901c6.ala.us-east-1.emqxsl.com"; 
const int mqttPort = 8883; 
const char* mqttUser = "userNode1"; 
const char* mqttPassword = "cqVC$#234"; 
const char* mqttTopic = "calidad_aire/nodo1"; 
// JSON 
JsonDocument doc; 
char payload[512]; 
//objetos globales 
WiFiClientSecure espClient; 
PubSubClient mqtt(espClient); 
Adafruit_BME280 bme; 
//Variables Sensores 
// BME280 
float temperatura = 0; 
float humedad = 0; 
float presion = 0; 
//nuevas variables 
float co2 = 0; 
float pm1 = 0; 
float pm25 = 0; 
float pm10 = 0; 
// MQ135 
int mq135ADC = 0; 
float mq135Voltaje = 0; 
// GP2Y1010 
int gpADC = 0; 
float gpVoltaje = 0; 
//contador 
uint32_t sequence = 0; 
//temporizador envio 
unsigned long previousMillis = 0; 
const unsigned long publishInterval = 10000; 
//muestras para PM media 
const int GP_MUESTRAS = 20; 
String chipID; 
String nombreNodo = "Node1"; 
time_t timestamp; 
String obtenerChipID() 
{ 
  uint64_t chipid = ESP.getEfuseMac(); 
  char id[17];
  sprintf( id, "%04X%08X", (uint16_t)(chipid >> 32), (uint32_t)chipid ); 
  return String(id); 
} 
//funcion conexion wifi y reconexion 
void conectarWiFi() 
{ 
  Serial.print("Conectando WiFi"); 
  WiFi.begin(ssid,password); 
  while(WiFi.status()!=WL_CONNECTED) 
  { 
    delay(500); 
    Serial.print("."); 
  } 
  Serial.println(); 
  Serial.println("WiFi conectado"); 
  Serial.print("IP: "); 
  Serial.println(WiFi.localIP()); 
} 
void verificarWiFi() 
{ 
  if(WiFi.status()==WL_CONNECTED) 
    return; 
  Serial.println("WiFi perdido"); 
  conectarWiFi(); 
} 
//conexion MQTT y reconexion 
void conectarMQTT() 
{ 
  while(!mqtt.connected()) 
  { 
    Serial.print("Conectando MQTT..."); 
    if( mqtt.connect( "ESP32_Node1", mqttUser, mqttPassword ) ) 
    { 
      Serial.println("OK"); 
    } 
    else 
    { 
      Serial.print("Error: "); 
      Serial.println( mqtt.state() ); 
      delay(3000); 
    } 
  } 
} 

void verificarMQTT() 
{ 
  if(mqtt.connected()) 
    return; 
  conectarMQTT();
} 
//inicializacion sensores 
bool iniciarBME() 
{ 
  Wire.begin( SDA_PIN, SCL_PIN ); 
  if(!bme.begin(0x76)) 
  { 
    Serial.println(); 
    Serial.println( "BME280 NO encontrado"); 
    return false; 
  } 
  Serial.println( "BME280 encontrado"); 
  return true; 
} 

void iniciarGP2Y() 
{ 
  pinMode( GP_LED, OUTPUT ); 
  digitalWrite( GP_LED, HIGH ); 
} 

//funcion imprimir estado del nodo 
void imprimirEstado() 
{ 
  Serial.println(); 
  Serial.println( "===== Nodo IoT ====="); 
  Serial.print("IP: "); 
  Serial.println( WiFi.localIP() ); 
  Serial.print("MQTT: "); 
  Serial.println( mqtt.connected() ); 
  Serial.print("Secuencia: "); 
  Serial.println(sequence); 
  Serial.println( "===================="); 
} 

//lecturas de sensores 
void leerBME280() 
{ 
  temperatura = bme.readTemperature(); 
  humedad = bme.readHumidity(); 
  presion = bme.readPressure() / 100.0; 
} 

void leerMQ135() 
{ 
  mq135ADC = analogRead(MQ135_PIN); 
  mq135Voltaje = (mq135ADC / 4095.0) * 3.3; 
} 

void leerGP2Y() 
{ 
  long suma = 0; 
  for(int i = 0; i < GP_MUESTRAS; i++) 
  { 
    digitalWrite(GP_LED, LOW); 
    delayMicroseconds(280); 
    suma += analogRead(GP_OUTPUT); 
    delayMicroseconds(40); 
    digitalWrite(GP_LED, HIGH); 
    delayMicroseconds(9680); 
  } 
  gpADC = suma / GP_MUESTRAS; 
  gpVoltaje = (gpADC / 4095.0) * 3.3; 
} 

void procesarMediciones() 
{ 
  leerBME280(); 
  leerMQ135(); 
  leerGP2Y(); 
  // Simulación temporal 
  co2 = map( mq135ADC, 0, 4095, 400, 1800 ); 
  pm25 = gpVoltaje * 100; 
  pm10 = pm25 * 1.2; 
  pm1 = pm25 * 0.6; 
  //Obtener el timestamp 
  timestamp = time(nullptr); 
} 
//crear json 
void crearJSON() 
{ 
  doc.clear(); 
  JsonObject dispositivo = doc["dispositivo"].to<JsonObject>(); 
  dispositivo["id"] = chipID; 
  dispositivo["nombre"]= nombreNodo; 
  dispositivo["firmware"] = "1.0.2"; 
  dispositivo["secuencia"] = sequence; 
  if (timestamp > 100000000)
  { 
    dispositivo["upTime"] = timestamp; 
  } 
  JsonObject entorno = doc["entorno"].to<JsonObject>(); 
  entorno["temperatura"] = temperatura; 
  entorno["humedad"] = humedad;
  JsonObject aire = doc["aire"].to<JsonObject>(); 
  aire["co2"] = co2; 
  aire["pm1_0"] = pm1; 
  aire["pm2_5"] = pm25; 
  aire["pm10"] = pm10; 
  serializeJson(doc, payload); 
} 
//funcion de depuracion 
void imprimirSensores() 
{ 
  Serial.println(); 
  Serial.println("===== Sensores ====="); 
  Serial.print("ChipID: "); 
  Serial.println(chipID); 
  Serial.print("uptime: "); 
  Serial.println(timestamp); 
  Serial.print("Temperatura: "); 
  Serial.println(temperatura); 
  Serial.print("Humedad: "); 
  Serial.println(humedad); 
  Serial.print("Presion: "); 
  Serial.println(presion); 
  Serial.print("MQ135 ADC: "); 
  Serial.println(mq135ADC); 
  Serial.print("GP2Y ADC: "); 
  Serial.println(gpADC); 
  Serial.println("co2: "); 
  Serial.println (co2); 
  Serial.println("pm1_0: "); 
  Serial.println (pm1); 
  Serial.println("pm2_5: "); 
  Serial.println (pm25); 
  Serial.println("pm10: "); 
  Serial.println (pm10); 
  Serial.println("===================="); 
} 
//publicar en Broker 
void publicarDatos() 
{ 
  crearJSON(); 
  if(mqtt.publish(mqttTopic, payload)) 
  { 
    Serial.println("Datos enviados"); 
    Serial.println(payload); 
    sequence++; 
  } 
  else 
  { 
    Serial.println("Error al publicar"); 
  } 
} 

void setup() 
{ 
  Serial.begin(115200); 
  chipID = obtenerChipID(); 
  delay(1000); 
  // 2. Configurar NTP (UTC-4 para Bolivia/Chile/etc.) 
  configTime(-4 * 3600, 0, "pool.ntp.org"); 
  // 3. Esperar brevemente a que el sistema se sincronice en segundo plano delay(2000); 
  Serial.println(); 
  Serial.println("======================"); 
  Serial.println("Nodo Calidad Aire"); 
  iniciarGP2Y(); 
  iniciarBME(); 
  conectarWiFi(); 
  espClient.setInsecure();
  mqtt.setServer( mqttServer, mqttPort ); 
  conectarMQTT(); 
  imprimirEstado(); 
} 
void loop() 
{ 
  verificarWiFi(); 
  verificarMQTT(); 
  mqtt.loop(); 
  unsigned long currentMillis = millis(); 
  if( currentMillis - previousMillis >= publishInterval ) 
  { 
    previousMillis = currentMillis; 
    procesarMediciones(); 
    imprimirSensores(); 
    publicarDatos(); 
  } 
}
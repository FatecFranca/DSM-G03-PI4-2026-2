
#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <HX711.h>
#include <time.h>
#include <math.h>

// ========================================
// CONFIGURACAO DOS PINOS
// ========================================

#define SENSOR_1_PIN 18
#define SENSOR_2_PIN 27

#define DHT_PIN 4
#define DHT_TYPE DHT22

#define HX711_DT 5
#define HX711_SCK 23
#define HX711_002_DT 19
#define HX711_002_SCK 22
#define HX711_003_DT 21
#define HX711_003_SCK 25

// ========================================
// WIFI E MQTT
// ========================================

const char* WIFI_SSID = "Wokwi-GUEST";
const char* WIFI_PASSWORD = "";

const char* MQTT_BROKER = "host.wokwi.internal";
const int MQTT_PORT = 28883;

const char* MQTT_USERNAME = "rabbitmq";
const char* MQTT_PASSWORD = "SUA_SENHA";

const char* DEVICE_ID = "esp32-local-001";
const char* SCALE_DEVICE_ID_002 = "esp32-local-002";
const char* SCALE_DEVICE_ID_003 = "esp32-local-003";

// ========================================
// OBJETOS
// ========================================

WiFiClient wifiClient;
PubSubClient mqtt(wifiClient);

DHT dht(DHT_PIN, DHT_TYPE);
HX711 balanca;
HX711 balanca002;
HX711 balanca003;

// ========================================
// VARIAVEIS
// ========================================

float temperatura = NAN;
float umidade = NAN;
float peso = 0;
float peso002 = 0;
float peso003 = 0;

const float FATOR_BALANCA = 420.0;

int entradas = 0;
int saidas = 0;
int pessoasDentro = 0;

bool anteriorS1 = HIGH;
bool anteriorS2 = HIGH;

enum Estado {
  ESPERANDO,
  ESPERANDO_S2,
  ESPERANDO_S1
};

Estado estado = ESPERANDO;

unsigned long inicioSequencia = 0;
unsigned long ultimaTelemetria = 0;
unsigned long ultimaTelemetriaAmbiental = 0;
unsigned long ultimaTentativaMQTT = 0;
unsigned long ultimaTentativaWiFi = 0;

const unsigned long TIMEOUT = 5000;
const unsigned long INTERVALO_TELEMETRIA = 2000;
const unsigned long INTERVALO_TELEMETRIA_AMBIENTAL = 10000;
const unsigned long INTERVALO_RECONEXAO = 5000;

// ========================================
// CONECTAR WIFI
// ========================================

void conectarWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  if (millis() - ultimaTentativaWiFi < INTERVALO_RECONEXAO) {
    return;
  }

  ultimaTentativaWiFi = millis();

  Serial.println("[WIFI] Tentando conectar...");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
}

// ========================================
// CONECTAR MQTT
// ========================================

void conectarMQTT() {
  if (WiFi.status() != WL_CONNECTED) return;
  if (mqtt.connected()) return;

  if (millis() - ultimaTentativaMQTT < INTERVALO_RECONEXAO) {
    return;
  }

  ultimaTentativaMQTT = millis();

  Serial.println("[MQTT] Tentando conectar...");

  String clientId = "wokwi-" + String(DEVICE_ID);

  bool conectado = mqtt.connect(
    clientId.c_str(),
    MQTT_USERNAME,
    MQTT_PASSWORD
  );

  if (conectado) {
    Serial.println("[MQTT] Conectado com sucesso!");
  } else {
    Serial.print("[MQTT] Falha. Codigo: ");
    Serial.println(mqtt.state());
  }
}

// ========================================
// TIMESTAMP
// ========================================

String timestampISO() {
  struct tm timeinfo;

  if (!getLocalTime(&timeinfo, 100)) {
    return "";
  }

  char buffer[25];

  strftime(
    buffer,
    sizeof(buffer),
    "%Y-%m-%dT%H:%M:%SZ",
    &timeinfo
  );

  return String(buffer);
}

// ========================================
// PUBLICAR SENSOR
// ========================================

void publicarSensor(
  const char* deviceId,
  const char* sensor,
  float valor,
  const char* unidade
) {
  if (!mqtt.connected()) {
    Serial.println("[MQTT] Sem conexao. Publicacao ignorada.");
    return;
  }

  if (!isfinite(valor)) {
    Serial.println("[MQTT] Valor invalido. Publicacao ignorada.");
    return;
  }

  String topico = "estokai/devices/";
  topico += deviceId;
  topico += "/telemetry/";
  topico += sensor;

  String payload = "{";
  payload += "\"deviceId\":\"" + String(deviceId) + "\",";
  payload += "\"value\":" + String(valor, 2) + ",";
  payload += "\"unit\":\"" + String(unidade) + "\",";
  payload += "\"timestamp\":\"" + timestampISO() + "\"";
  payload += "}";

  bool enviado = mqtt.publish(
    topico.c_str(),
    payload.c_str()
  );

  if (enviado) {
    Serial.print("[MQTT] ENVIADO -> ");
    Serial.println(topico);
    Serial.println(payload);
  } else {
    Serial.print("[MQTT] FALHA -> ");
    Serial.println(topico);
  }
}

// ========================================
// LEITURA DHT22
// ========================================

void atualizarDHT() {
  temperatura = dht.readTemperature();
  umidade = dht.readHumidity();

  if (isnan(temperatura)) {
    Serial.println("[DHT22] ERRO ao ler temperatura!");
  } else {
    Serial.print("[DHT22] Temperatura: ");
    Serial.print(temperatura, 2);
    Serial.println(" C");
  }

  if (isnan(umidade)) {
    Serial.println("[DHT22] ERRO ao ler umidade!");
  } else {
    Serial.print("[DHT22] Umidade: ");
    Serial.print(umidade, 2);
    Serial.println(" %");
  }
}

// ========================================
// LEITURA BALANCA
// ========================================

void atualizarBalanca(HX711& sensor, float& pesoAtual, const char* deviceId) {
  if (!sensor.is_ready()) {
    Serial.print("[HX711] Sensor indisponivel: ");
    Serial.println(deviceId);
    return;
  }

  pesoAtual = sensor.get_units(1);

  if (pesoAtual > -0.02 && pesoAtual < 0.02) {
    pesoAtual = 0;
  }

  Serial.print("[HX711] Peso ");
  Serial.print(deviceId);
  Serial.print(": ");
  Serial.print(pesoAtual, 2);
  Serial.println(" kg");
}

// HX711::tare() usa read(), que espera indefinidamente pelo proximo dado.
// No simulador (ou se o sensor estiver desconectado) isso pode travar o setup.
bool zerarBalanca(HX711& sensor, const char* deviceId) {
  const byte AMOSTRAS_TARA = 5;
  long soma = 0;

  for (byte i = 0; i < AMOSTRAS_TARA; i++) {
    if (!sensor.wait_ready_timeout(2000, 1)) {
      Serial.print("[HX711] Timeout ao zerar: ");
      Serial.println(deviceId);
      return false;
    }

    soma += sensor.read();
  }

  sensor.set_offset(soma / AMOSTRAS_TARA);
  Serial.print("[HX711] Balanca ");
  Serial.print(deviceId);
  Serial.println(" zerada.");
  return true;
}

// ========================================
// CONTADOR DE PESSOAS
// ========================================

void registrarEntrada() {
  entradas++;
  pessoasDentro++;

  Serial.println("[PESSOAS] ENTRADA DETECTADA");

  Serial.print("Pessoas dentro: ");
  Serial.println(pessoasDentro);

  estado = ESPERANDO;
}

void registrarSaida() {
  if (pessoasDentro <= 0) {
    Serial.println("[PESSOAS] Saida ignorada: ambiente vazio.");
    estado = ESPERANDO;
    return;
  }

  saidas++;
  pessoasDentro--;

  Serial.println("[PESSOAS] SAIDA DETECTADA");

  Serial.print("Pessoas dentro: ");
  Serial.println(pessoasDentro);

  estado = ESPERANDO;
}

void pressionouS1() {
  if (estado == ESPERANDO) {
    estado = ESPERANDO_S2;
    inicioSequencia = millis();

    Serial.println("[S1] Aguardando S2...");
  }
  else if (estado == ESPERANDO_S1) {
    registrarSaida();
  }
}

void pressionouS2() {
  if (estado == ESPERANDO) {
    estado = ESPERANDO_S1;
    inicioSequencia = millis();

    Serial.println("[S2] Aguardando S1...");
  }
  else if (estado == ESPERANDO_S2) {
    registrarEntrada();
  }
}

void atualizarBotoes() {
  bool atualS1 = digitalRead(SENSOR_1_PIN);
  bool atualS2 = digitalRead(SENSOR_2_PIN);

  if (anteriorS1 == HIGH && atualS1 == LOW) {
    pressionouS1();
  }

  if (anteriorS2 == HIGH && atualS2 == LOW) {
    pressionouS2();
  }

  anteriorS1 = atualS1;
  anteriorS2 = atualS2;
}

void verificarTimeout() {
  if (estado == ESPERANDO) return;

  if (millis() - inicioSequencia > TIMEOUT) {
    Serial.println("[PESSOAS] Sequencia expirada.");
    estado = ESPERANDO;
  }
}

// ========================================
// TELEMETRIA
// ========================================

void telemetria() {
  Serial.println();
  Serial.println("========== TELEMETRIA ==========");

  atualizarBalanca(balanca, peso, DEVICE_ID);
  atualizarBalanca(balanca002, peso002, SCALE_DEVICE_ID_002);
  atualizarBalanca(balanca003, peso003, SCALE_DEVICE_ID_003);

  Serial.print("[PESSOAS] Entradas: ");
  Serial.println(entradas);

  Serial.print("[PESSOAS] Saidas: ");
  Serial.println(saidas);

  Serial.print("[PESSOAS] Dentro: ");
  Serial.println(pessoasDentro);

  if (balanca.is_ready()) {
    publicarSensor(DEVICE_ID, "weight", peso, "kg");
  }

  if (balanca002.is_ready()) {
    publicarSensor(SCALE_DEVICE_ID_002, "weight", peso002, "kg");
  }

  if (balanca003.is_ready()) {
    publicarSensor(SCALE_DEVICE_ID_003, "weight", peso003, "kg");
  }

  publicarSensor(DEVICE_ID, "motion", pessoasDentro, "people");

  Serial.println("================================");
}

void telemetriaAmbiental() {
  atualizarDHT();

  if (!isnan(temperatura)) {
    publicarSensor(DEVICE_ID, "temperature", temperatura, "C");
  }

  if (!isnan(umidade)) {
    publicarSensor(DEVICE_ID, "humidity", umidade, "%");
  }
}

// ========================================
// SETUP
// ========================================

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println();
  Serial.println("================================");
  Serial.println("       ESTOKAI IOT - ESP32");
  Serial.println("================================");

  pinMode(SENSOR_1_PIN, INPUT_PULLUP);
  pinMode(SENSOR_2_PIN, INPUT_PULLUP);

  dht.begin();

  Serial.println("[DHT22] Inicializado no GPIO 4");

  balanca.begin(HX711_DT, HX711_SCK);
  balanca.set_scale(FATOR_BALANCA);
  balanca002.begin(HX711_002_DT, HX711_002_SCK);
  balanca002.set_scale(FATOR_BALANCA);
  balanca003.begin(HX711_003_DT, HX711_003_SCK);
  balanca003.set_scale(FATOR_BALANCA);

  zerarBalanca(balanca, DEVICE_ID);
  zerarBalanca(balanca002, SCALE_DEVICE_ID_002);
  zerarBalanca(balanca003, SCALE_DEVICE_ID_003);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  mqtt.setServer(MQTT_BROKER, MQTT_PORT);
  mqtt.setBufferSize(512);
  mqtt.setKeepAlive(30);
  mqtt.setSocketTimeout(2);

  configTime(0, 0, "pool.ntp.org");

  Serial.println("[SISTEMA] Inicializacao concluida.");
  Serial.println("[SISTEMA] Entrada: S1 -> S2");
  Serial.println("[SISTEMA] Saida: S2 -> S1");
}

// ========================================
// LOOP PRINCIPAL
// ========================================

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    conectarWiFi();
  } else {
    if (!mqtt.connected()) {
      conectarMQTT();
    } else {
      mqtt.loop();
    }
  }

  atualizarBotoes();
  verificarTimeout();

  if (millis() - ultimaTelemetria >= INTERVALO_TELEMETRIA) {
    ultimaTelemetria = millis();
    telemetria();
  }

  if (millis() - ultimaTelemetriaAmbiental >= INTERVALO_TELEMETRIA_AMBIENTAL) {
    ultimaTelemetriaAmbiental = millis();
    telemetriaAmbiental();
  }

  delay(10);
}

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ESP8266mDNS.h>
#include <ArduinoJson.h>
#include <FS.h>
#include <SimpleDHT.h>

//char mySsid = "flick-click";
//char password = "esp8266";

ESP8266WebServer server;
int pin_led = 2;
int pin_led1 = 12;
int pin_light = 13;
int light_val = 0;
int pin_pir = 5;
int pin_DHT11 = 4;
int pin_button = 14;


boolean motion_enable = false;

int button_current;
int button_previous = LOW;
unsigned long startTime2;

SimpleDHT11 dht11(pin_DHT11);
byte temperature = 0;
byte humidity = 0;
int err = SimpleDHTErrSuccess;


void handle_NotFound();
void handleserver();
void feedback();
void saveSsidAndPass();
void readSsidAndPass();
void connectwifi();
void connecting();
void apmode();
void access();


void setup(){
  pinMode(pin_led, OUTPUT);
  pinMode(pin_led1, OUTPUT);
  pinMode(pin_button, INPUT);
  pinMode(pin_pir, INPUT);
  analogWrite(pin_light, 0);
  SPIFFS.begin();
  Serial.begin(115200);
  
  readSsidAndPass();
  
  server.on("/", handleserver);
  server.onNotFound(handle_NotFound);
  server.begin();
  MDNS.addService("http", "tcp", 80);
  digitalWrite(pin_led, !digitalRead(pin_led));
}

void loop()
{
  server.handleClient();
  MDNS.update();
  button_current = digitalRead(pin_button);
  if (button_current == HIGH && button_previous == LOW)
  {
    if (light_val == 0)
    {
      digitalWrite(pin_led, !digitalRead(pin_led));
      analogWrite(pin_light, 0);
      light_val++;
    }else if (light_val == 1)
    {
      digitalWrite(pin_led, HIGH);
      analogWrite(pin_light, 342);      
      light_val++;
    }else if (light_val == 2)
    {

      digitalWrite(pin_led, HIGH);
      analogWrite(pin_light, 684);
      light_val++;
    }else if (light_val == 3)
    {
      digitalWrite(pin_led, HIGH);
      analogWrite(pin_light, 1023);
      light_val = 0;
    }
    motion_enable = false;
  }
  button_previous = button_current;
  
  if (motion_enable)
  {
    if (digitalRead(pin_pir) == HIGH)
    {
      light_val = 0;
      digitalWrite(pin_led, HIGH);
      analogWrite(pin_light, 1023);
      startTime2 = millis();
    }  
    if ((unsigned long)(millis() - startTime2) >= 5000)
    {
      light_val = 1;
      digitalWrite(pin_led, LOW);
      analogWrite(pin_light, 0);
    }
  }  
}

void handle_NotFound(){
  server.send(404, "text/plain", "Not found");
}

void handleserver()
{
  String led = server.arg("led");
  String motion = server.arg("motion");
  
  if(led == "off")
  {
    digitalWrite(pin_led, LOW);
    light_val = 1;
    analogWrite(pin_light, 0);
    access();
    server.send(404,"");
  }else if(led == "1")
  {
    digitalWrite(pin_led, HIGH);
    light_val = 2;
    analogWrite(pin_light, 342);
    access();
    server.send(404,"");
  }else if(led == "2")
  {
    digitalWrite(pin_led, HIGH);
    light_val = 3;
    analogWrite(pin_light, 684);
    access();
    server.send(404,"");
  }else if(led == "3")
  {
    digitalWrite(pin_led, HIGH);
    light_val = 0;
    analogWrite(pin_light, 1023);
    access();
    server.send(404,"");
  }
  
  if(server.hasArg("feedback"))
  {
    feedback();
  }
  
  if(motion == "on")
  {
    Serial.println("");
    Serial.println("motionon");
    motion_enable = true;
    access();
    server.send(404,"");
  }else if(motion == "off")
  {
    Serial.println("");
    Serial.println("motionoff");
    motion_enable = false;
    access();
    server.send(404,"");
  }
  
  if(server.hasArg("ssid") && server.hasArg("pass"))
  {    
    String ssid = server.arg("ssid");
    String pass = server.arg("pass");
    Serial.println("1");
    saveSsidAndPass(ssid, pass);
  }
}

void feedback ()
{
    if ((err = dht11.read(&temperature, &humidity, NULL)) != SimpleDHTErrSuccess);

    String feedback;
    StaticJsonBuffer<200> jsonBuffer;
    JsonObject& root = jsonBuffer.createObject();
   
    root["temprature"] = (int)temperature;
    root["humidity"] = (int)humidity;
    if (light_val == 0)
    {
      root["ledstate"] = 3;
    }else
    {
      root["ledstate"] = light_val - 1;
    }
    root["connectionstatus"] = WiFi.status();
    root["motiondetected"] = digitalRead(pin_pir);
    root["motionstate"] = motion_enable;
    root.printTo(Serial);
    root.printTo(feedback);  //Store JSON in String variable

    access();
    server.send(200, "application/json", feedback);
}

void saveSsidAndPass(String ssid, String pass)
{
  Serial.println("2");
  DynamicJsonBuffer jsonBuffer;
  JsonObject& root = jsonBuffer.createObject();
  root["ssid"] = ssid;
  root["pass"] = pass;
  File configFile = SPIFFS.open("/config.json", "w");
  root.printTo(configFile);  
  configFile.close();
  Serial.println(ssid);
  Serial.println(pass);
  connectwifi(ssid, pass);
}

void readSsidAndPass()
{
  if(SPIFFS.exists("/config.json")){
    const char *_ssid, *_pass;
    File cnfigFile = SPIFFS.open("/config.json", "r");
    size_t size = cnfigFile.size();
    std::unique_ptr<char[]> buf(new char[size]);
    cnfigFile.readBytes(buf.get(), size);
    cnfigFile.close();
    DynamicJsonBuffer jBuffer;
    JsonObject& Object = jBuffer.parseObject(buf.get());
    _ssid = Object["ssid"];
    _pass = Object["pass"];
  
    String ssidstring = String(_ssid);
    String passstring = String(_pass);

    Serial.println("");
    Serial.println(_ssid);
    Serial.println(_pass);
    connectwifi(ssidstring, passstring);
  }else
  {
    apmode();
  }
}

void connectwifi(String ssid, String pass)
{
  Serial.println("3");
  WiFi.mode(WIFI_STA);
  WiFi.disconnect();
  delay(100);
  int nwifi = WiFi.scanNetworks();
  WiFi.begin(ssid, pass);

  if (nwifi == 0)
    Serial.println("no networks found");
  else
  {
    for (int i = 0; i < nwifi; ++i)
    {
      if (WiFi.SSID(i) == ssid)
      {
        digitalWrite(pin_led, HIGH);
        digitalWrite(pin_led1, LOW);
        connecting(ssid, pass);            
          
        if (!MDNS.begin("esp8266")) {
          Serial.println("Error setting up MDNS responder!");
          connecting(ssid, pass);
          if(WiFi.status() != WL_CONNECTED)
          {
                while (1) 
                {
                  delay(1000);
                  digitalWrite(pin_led, LOW);
                  digitalWrite(pin_led1, HIGH);
                }
          }
        }
        Serial.println("mDNS responder started");
        server.send(200,"text/plain","correct ssid and password");
        if(WiFi.status() == WL_CONNECTED) // indicate
        {
          for(int n = 0; n < 18; n++)
          {
            digitalWrite(pin_led,!digitalRead(pin_led));
            delay(50);
          }
          digitalWrite(pin_led, HIGH);
          digitalWrite(pin_led1, LOW);
        }
        break;  
      }
      delay(10);
    }
  }

  if (WiFi.status() != WL_CONNECTED)
  {
    apmode();
  } 
  Serial.println("");
  WiFi.printDiag(Serial);
}

void connecting(String ssid, String pass)
{
  Serial.println("");
  Serial.print("connecting to:");
  Serial.print(ssid);
  unsigned long startTime = millis();
  while (WiFi.status() != WL_CONNECTED) 
  {
    delay(500);

    Serial.print(".");
    digitalWrite(pin_led,!digitalRead(pin_led));
    if ((unsigned long)(millis() - startTime) >= 10000) break;
  }
  if(WiFi.status() != WL_CONNECTED) // recover
  {
    Serial.println("");
    Serial.print("re connecting:");
    WiFi.begin(ssid, pass);
    unsigned long startTime1 = millis();
    while (WiFi.status() != WL_CONNECTED) 
    {
      delay(500);
      Serial.print(".");
      digitalWrite(pin_led,!digitalRead(pin_led));
      if ((unsigned long)(millis() - startTime1) >= 7000) break;
    }
  }
  if(WiFi.status() != WL_CONNECTED) // wrong pass or time out
  {
    Serial.println("wrong pass or time out");
    return;
  }
  
  Serial.println("");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
}

void apmode()
{  
  WiFi.disconnect();
  digitalWrite(pin_led, LOW);
  digitalWrite(pin_led1, HIGH);
  IPAddress local_ip(192,168,11,4); // local AP IP
  IPAddress gateway(192,168,11,1);
  IPAddress netmask(255,255,255,0);
  WiFi.mode(WIFI_AP);
  WiFi.softAPConfig(local_ip, gateway, netmask);
  WiFi.softAP("esp8266_flick_click"); 
  
  Serial.println("");
  Serial.print("Local AP IP Address: ");
  Serial.println(local_ip);
}

void access()
{
  server.sendHeader("Connection", "close");
  server.sendHeader("Cache-Control", "max-age=<1>");
  server.sendHeader("Access-Control-Allow-Origin", "*");
}

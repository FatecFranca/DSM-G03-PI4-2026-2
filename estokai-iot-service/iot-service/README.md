# Estokai IoT Service

## Executar o ESP32 no VS Code com Wokwi

1. Conecte o VS Code ao servidor com a extensao **Remote - SSH**.
2. Instale as extensoes **PlatformIO IDE** e **Wokwi Simulator** no destino
   `SSH: <servidor>`.
3. Abra esta pasta como a raiz do workspace remoto.
4. Execute `PlatformIO: Build` pela paleta de comandos (`Ctrl+Shift+P`). Isso gera
   `.pio/build/esp32dev/firmware.bin` e `.elf`.
5. Execute `Wokwi: Start Simulator` pela paleta de comandos.

O `platformio.ini` usa `wokwi/` como codigo-fonte e instala automaticamente as
bibliotecas do sketch. O `wokwi.toml` aponta para o firmware produzido pelo
PlatformIO.

O sketch usa `host.wokwi.internal:1883`. Quando o Wokwi esta instalado no destino
Remote SSH, esse endereco alcanca o `127.0.0.1:1883` do servidor, onde o Mosquitto
do `compose.yaml` esta publicado. Confirme a conexao com:

```bash
docker logs -f estokai-mosquitto-1
```

> O sketch usa MQTT sem TLS na porta 1883, em conformidade com a configuracao atual
> do Mosquitto. Para TLS, configure certificados no broker e use `WiFiClientSecure`
> com uma porta TLS, normalmente 8883.

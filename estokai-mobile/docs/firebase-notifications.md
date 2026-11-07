# Notificações de estoque baixo (Firebase)

O aplicativo obtém o token nativo do Firebase Cloud Messaging (FCM) e, após o login, envia-o autenticado para:

```http
POST /notificacoes/dispositivos
Authorization: Bearer <token-do-usuario>
Content-Type: application/json

{
  "token": "token-fcm-do-dispositivo",
  "plataforma": "android",
  "provedor": "fcm"
}
```

O endpoint deve fazer *upsert* do token e associá-lo ao usuário/empresa autenticado. Nunca envie a chave privada da conta de serviço Firebase para o aplicativo.

## Regra no backend

Depois de cada operação que diminua `qtdEstoque`, o backend deve comparar os valores persistidos:

```text
estavaNormal = estoqueAnterior >= qtdMinima
ficouBaixo   = estoqueAtual < qtdMinima

se estavaNormal e ficouBaixo:
  enviar FCM para os dispositivos da empresa
  título: "Estoque baixo"
  corpo: "<produto> atingiu <estoqueAtual> unidades (mínimo: <qtdMinima>)."
  data: { tipo: "estoque_baixo", produtoId: "..." }
```

Ao repor o produto acima do mínimo, marque-o novamente como normal. Dessa forma, um produto só gera um novo alerta quando volta a cruzar o limite, evitando notificações repetidas a cada venda.

## Configuração manual necessária

1. No Firebase Console, crie ou selecione o projeto do Estokai e registre o app Android com o identificador `com.estokai.mobile`.
2. Baixe `google-services.json`, coloque-o na raiz deste repositório e inclua no `app.json`:

```json
"android": {
  "googleServicesFile": "./google-services.json"
}
```

3. No Firebase Console, gere uma chave de conta de serviço. Guarde-a somente no backend (por exemplo, em um segredo do Cloud Run) e use Firebase Admin SDK para enviar mensagens aos tokens registrados.
4. Gere um novo development build Android. O Expo Go não oferece push remoto em Android no SDK 57.

O `google-services.json` contém identificadores públicos e pode ser versionado. Já a chave de conta de serviço é secreta e não deve ser versionada nem instalada no celular.

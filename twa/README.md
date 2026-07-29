# 📱 BoraMarka — Guia de Publicação na Google Play Store via TWA

Este guia descreve os passos simples para empacotar o PWA do **BoraMarka** como um aplicativo Android nativo utilizando **Trusted Web Activity (TWA)** via **Bubblewrap CLI**.

---

## 🛠️ Passo a Passo de Geração

### 1. Instalar o Bubblewrap CLI
```bash
npm install -g @bubblewrap/cli
```

### 2. Inicializar o Projeto TWA
Execute no terminal a partir do diretório raiz:
```bash
bubblewrap init --manifest=https://boramarka.com.br/manifest.json
```

O Bubblewrap detectará automaticamente as configurações do `manifest.json` do frontend (nome, cores, ícones, start_url).

### 3. Configurar a Chave de Assinatura (Keystore)
Quando solicitado pelo Bubblewrap:
- **Package ID**: `br.com.boramarka.app`
- **Application Name**: `BoraMarka`
- **Keystore Location**: `boramarka-release-key.jks`

### 4. Gerar o Arquivo APK / AAB
```bash
bubblewrap build
```

Isso gerará o arquivo `app-release-signed.aab` pronto para upload no **Google Play Console**.

---

## 🔐 Configuração do Digital Asset Links (Obrigatório)

Para que o aplicativo abra em tela cheia **sem a barra de navegação do browser**:

1. Pegue a impressão digital SHA-256 da sua chave no Google Play Console (`Configurações > Integridade do App`).
2. Atualize o arquivo [`twa/assetlinks.json`](file:///c:/Users/bruno/Desktop/MEI%20-%20BRUNO%20SANTANA%20REIS/Trabalho/Programa%C3%A7%C3%A3o/Sistema%20Marca%C3%A7%C3%A3o/twa/assetlinks.json) com essa impressão digital.
3. Copie o arquivo para o servidor de produção no caminho:
   `https://boramarka.com.br/.well-known/assetlinks.json`

---

## 🚀 Status
- [x] Configuração base `assetlinks.json` gerada em `twa/assetlinks.json`
- [x] PWA manifest configurado no frontend
- [ ] Upload da compilação AAB na Play Console

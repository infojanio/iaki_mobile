Auditoria de Publicação – App iaki (Android/Play Store)

Data: 10/09/2025

✅ Resumo

Foi realizada uma auditoria técnica no projeto React Native/Expo com foco em adequação às exigências atuais da Play Store, reforço de segurança/privacidade e padronização conforme práticas de mercado.

🔹 Alterações aplicadas

Target API atualizado para 35 (Android 15)

android/build.gradle ajustado.

Assinatura de release mais segura

Removido uso de debug.keystore em build de produção.

Incluída lógica para uso de keystore.properties (quando presente).

Otimizações de build

Ativado minifyEnabled true e shrinkResources true.

Adicionado proguard-rules.pro com regras básicas (mantendo classes do React Native/Hermes e removendo logs Log.d/i/v).

AndroidManifest reforçado

Removidas permissões obsoletas (READ/WRITE_EXTERNAL_STORAGE, SYSTEM_ALERT_WINDOW).

Incluído android:allowBackup="false" e android:usesCleartextTraffic="false".

Gradle.properties

Adicionados flags de otimização e segurança (enableProguardInReleaseBuilds, enableShrinkResourcesInReleaseBuilds).

.gitignore atualizado

Ignora arquivos sensíveis (_.jks, keystore.properties, google-services.json) e logs de crash (hs_err_pid_.log).

EAS Profiles

Criado perfil production para geração de .aab (necessário para publicação).

🔹 Itens pendentes (ação manual recomendada)

Permissões

removido <uses-permission android:name="android.permission.RECORD_AUDIO" />.

Confirmar justificativa para uso de localização (apenas para cashback).

Keystore

Revogar/remover qualquer .jks armazenado no repositório.

Configurar assinatura segura via EAS Credentials ou keystore.properties local (fora do Git).

Conteúdo in-app

Adicionar acesso permanente à Política de Privacidade e Termos de Uso em “Configurações” ou “Sobre”.

Testes finais

Validar build de produção (eas build -p android --profile production) em dispositivos Android 13, 14 e 15.

Testar permissões de localização e uploads em produção.

Publicação na Play Store

Criar conta no Play Console.

Preencher questionários de Data Safety, Classificação etária e anexar Política de Privacidade (link público).

Subir o .aab gerado pelo perfil de produção.

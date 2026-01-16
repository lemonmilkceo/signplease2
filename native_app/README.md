# 싸인해주세요 네이티브 앱 (Flutter)

이 프로젝트는 `싸인해주세요` 웹 서비스를 네이티브 앱(WebView)으로 패키징하는 Flutter 셸 프로젝트입니다.

## 필수 요구 사항

- [Flutter SDK](https://flutter.dev/docs/get-started/install) (3.0.0 이상)
- Android Studio / Xcode (빌드용)

## 프로젝트 구조

- `lib/main.dart`: WebView 로직 및 React 웹 앱과의 통신 브릿지(`NativeBridge`)가 구현되어 있습니다.
- `pubspec.yaml`: 필요한 의존성(`webview_flutter`, `share_plus` 등)이 정의되어 있습니다.

## 빌드 방법

1. 의존성 설치:
   ```bash
   flutter pub get
   ```

2. 실행 (에뮬레이터 또는 실기기 연결 필요):
   ```bash
   flutter run
   ```

## 주요 기능 (Native Bridge)

웹 앱(`src/lib/native-bridge.ts`)에서 다음 요청을 네티브로 보낼 수 있습니다:

- `SHARE`: 네이티브 공유 시트 호출
- `REQUEST_PUSH_TOKEN`: FCM 토큰 요청 (시뮬레이션 포함)

## 배포 시 주의사항

- `lib/main.dart`의 `loadRequest` URL을 실제 배포된 웹 서비스 주소로 변경해야 합니다.
- Android/iOS 각각의 패키지 명칭 및 권한 설정(카메라, 푸시 등)을 `AndroidManifest.xml` 및 `Info.plist`에서 조정하세요.

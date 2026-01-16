import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:share_plus/share_plus.dart';
import 'dart:convert';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '싸인해주세요',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF3355FF)),
        useMaterial-design: true,
      ),
      home: const WebViewShell(),
    );
  }
}

class WebViewShell extends StatefulWidget {
  const WebViewShell({super.key});

  @override
  State<WebViewShell> createState() => _WebViewShellState();
}

class _WebViewShellState extends State<WebViewShell> {
  late final WebViewController _controller;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0x00000000))
      ..setNavigationDelegate(
        NavigationDelegate(
          onProgress: (int progress) {
            // Update loading bar.
          },
          onPageStarted: (String url) {
            setState(() { _isLoading = true; });
          },
          onPageFinished: (String url) {
            setState(() { _isLoading = false; });
          },
          onWebResourceError: (WebResourceError error) {},
          onNavigationRequest: (NavigationRequest request) {
            if (request.url.startsWith('https://www.youtube.com/')) {
              return NavigationDecision.prevent;
            }
            return NavigationDecision.navigate;
          },
        ),
      )
      ..addJavaScriptChannel(
        'NativeBridge',
        onMessageReceived: (JavaScriptMessage message) {
          _handleMessage(message.message);
        },
      )
      ..loadRequest(Uri.parse('https://signplease-worker.vercel.app')); // TODO: Replace with real URL
  }

  void _handleMessage(String messageStr) {
    try {
      final message = jsonDecode(messageStr);
      final type = message['type'];
      final payload = message['payload'];

      switch (type) {
        case 'SHARE':
          Share.share(payload['text'], subject: payload['title']);
          break;
        case 'REQUEST_PUSH_TOKEN':
          // Simulate push token response
          _sendToWeb({'type': 'PUSH_TOKEN', 'payload': 'test_token_123456'});
          break;
        default:
          print('Unknown message type: $type');
      }
    } catch (e) {
      print('Error handling native message: $e');
    }
  }

  void _sendToWeb(Map<String, dynamic> message) {
    final jsonStr = jsonEncode(message);
    _controller.runJavaScript('handleNativeMessage(\'$jsonStr\')');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Stack(
          children: [
            WebViewWidget(controller: _controller),
            if (_isLoading)
              const Center(
                child: CircularProgressIndicator(),
              ),
          ],
        ),
      ),
    );
  }
}

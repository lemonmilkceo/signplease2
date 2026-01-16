/**
 * Native Bridge for Flutter WebView
 * Handles communication between the React web app and the Flutter native shell.
 */

interface NativeMessage {
    type: string;
    payload?: any;
}

class NativeBridge {
    private isNative: boolean;

    constructor() {
        // Check if running inside Flutter WebView
        this.isNative = !!(window as any).Toaster || !!(window as any).flutter_inappwebview;
    }

    /**
     * Send a message to the Native shell
     */
    postMessage(message: NativeMessage) {
        if ((window as any).NativeBridge) {
            (window as any).NativeBridge.postMessage(JSON.stringify(message));
        } else {
            console.log("NativeBridge not found. Message:", message);
        }
    }

    /**
     * Request push notification token from Native
     */
    requestPushToken() {
        this.postMessage({ type: 'REQUEST_PUSH_TOKEN' });
    }

    /**
     * Trigger native share sheet
     */
    nativeShare(title: string, text: string, url: string) {
        this.postMessage({
            type: 'SHARE',
            payload: { title, text, url }
        });
    }

    /**
     * Set native app badge (if supported)
     */
    setBadge(count: number) {
        this.postMessage({
            type: 'SET_BADGE',
            payload: { count }
        });
    }
}

export const nativeBridge = new NativeBridge();

// Global handler for messages FROM native TO web
(window as any).handleNativeMessage = (messageStr: string) => {
    try {
        const message = JSON.parse(messageStr);
        console.log("Received from native:", message);

        // Dispatch custom event for app components to listen
        const event = new CustomEvent('nativeMessage', { detail: message });
        window.dispatchEvent(event);
    } catch (e) {
        console.error("Failed to parse native message:", e);
    }
};

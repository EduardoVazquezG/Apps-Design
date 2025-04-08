import axios from 'axios';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

const BACKEND_URL = 'http://192.168.0.127:3001'; // CAMBIAR LA IP A LA DE TU COMPUTADORA, EL PUERTO NO SE CAMBIAA

const PayPalCheckout = ({ amount, onPaymentSuccess, onClose = () => { } }) => {
  const [approvalUrl, setApprovalUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasCompletedPayment, setHasCompletedPayment] = useState(false);
  const isPaymentFinalized = useRef(false);
  const webViewRef = useRef(null);

  useEffect(() => {
    if (hasCompletedPayment) return;
    if (Number(amount) <= 0) {
      console.warn('[PayPal] Monto inválido:', amount);
      onClose();
      return;
    }
    console.log('[PayPal] Monto recibido:', amount);
    const initPayment = async () => {
      try {
        console.log('[PayPal] Solicitando URL de pago...');
        const response = await axios.post(`${BACKEND_URL}/create-payment`, {
          amount: Number(amount)
        });
        console.log('[PayPal] Respuesta del backend:', response.data);
        if (!response.data?.approvalUrl) {
          throw new Error('No se recibió la URL de PayPal');
        }
        setApprovalUrl(response.data.approvalUrl);
      } catch (err) {
        console.error('[PayPal] Error:', {
          message: err.message,
          response: err.response?.data,
        });
        Alert.alert('Error', 'No se pudo conectar con PayPal');
        onClose();
      } finally {
        setLoading(false);
      }
    };
    initPayment();
  }, [amount, onClose, hasCompletedPayment]);

  const getQueryParams = (url) => {
    const params = {};
    const parts = url.split('?');
    if (parts.length < 2) return params;
    parts[1].split('&').forEach((param) => {
      const [key, value] = param.split('=');
      params[key] = value;
    });
    return params;
  };

  const handleNavigationStateChange = (navState) => {
    console.log('[PayPal] Navegando a:', navState.url);
    if (isPaymentFinalized.current) return;

    if (navState.url.includes('/checkout/complete')) {
      if (!isPaymentFinalized.current) {
        isPaymentFinalized.current = true;
        const queryParams = getQueryParams(navState.url);
        const paymentId = queryParams.token;
        const payerId = queryParams.PayerID;
        if (paymentId && payerId) {
          axios.post(`${BACKEND_URL}/execute-payment`, { paymentId, payerId })
            .then(response => {
              console.log('[PayPal] Pago completado:', response.data);
              if (webViewRef.current) {
                webViewRef.current.stopLoading();
              }
              onPaymentSuccess(response.data);
              onClose();
            })
            .catch(error => {
              console.error('[PayPal] Error al capturar el pago', error);
              onClose();
            });
        } else {
          console.error('[PayPal] No se pudieron obtener los parámetros necesarios');
          onClose();
        }
      }
    }

    if (navState.url.includes('/checkout/cancel')) {
      console.log('[PayPal] Pago cancelado');
      isPaymentFinalized.current = true;
      onClose();
    }
  };

  useEffect(() => {
    const paymentTimeout = setTimeout(() => {
      if (!isPaymentFinalized.current) {
        console.warn('[PayPal] Tiempo de espera agotado');
        Alert.alert('Error', 'El pago tardó demasiado en completarse');
        onClose();
      }
    }, 120000);
    return () => clearTimeout(paymentTimeout);
  }, [onClose]);

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#00457C" style={styles.loader} />
      ) : (
        <WebView
          ref={webViewRef}
          source={{ uri: approvalUrl }}
          onNavigationStateChange={handleNavigationStateChange}
          onError={(error) => {
            console.error('[WebView] Error:', error.nativeEvent);
            if (!isPaymentFinalized.current) onClose();
          }}
          onHttpError={(error) => {
            console.error('[WebView] HTTP Error:', error.nativeEvent.statusCode);
            if (!isPaymentFinalized.current) onClose();
          }}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={false}
          incognito={true}
          startInLoadingState={true}
          renderLoading={() => (
            <ActivityIndicator size="large" color="#00457C" style={styles.loader} />
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
  },
  webview: {
    flex: 1,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default PayPalCheckout;

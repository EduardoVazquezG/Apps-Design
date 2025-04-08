import React, { useState, useEffect, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import Constants from 'expo-constants';

// 1. Carga diferida de Firebase (Lazy Loading)
const firebaseModules = {
  app: () => import('firebase/app'),
  auth: () => import('firebase/auth'),
  firestore: () => import('firebase/firestore'),
  analytics: () => import('firebase/analytics')
};

// 2. Configuraciones predefinidas
const CLOUDINARY_CLOUD_NAME = 'df5qzxunp';
const OPENCAGE_API_KEY = 'd513eeb858f34ef7bbfaaeab1c8d928a';

// Mantén el splash screen visible mientras inicializamos
SplashScreen.preventAutoHideAsync();

const AppInitializer = ({ children }) => {
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState(null);

  const onLayoutRootView = useCallback(async () => {
    if (initialized) {
      await SplashScreen.hideAsync();
    }
  }, [initialized]);

  useEffect(() => {
    const initializeAllAPIs = async () => {
      try {
        // 3. Inicialización en paralelo
        await Promise.all([
          initializeFirebase(),
          checkOpenCageAPI()
        ]);
        
        setInitialized(true);
      } catch (err) {
        console.error('Error inicializando APIs:', err);
        setError(`Error de inicialización: ${err.message}`);
      }
    };

    initializeAllAPIs();
  }, []);

  const initializeFirebase = async () => {
    // 4. Carga diferida de Firebase
    const { initializeApp } = await firebaseModules.app();
    const { getAuth } = await firebaseModules.auth();
    const { getFirestore } = await firebaseModules.firestore();
    const { getAnalytics } = await firebaseModules.analytics();

    const firebaseConfig = {
      apiKey: Constants.expoConfig.extra.apiKey,
      authDomain: Constants.expoConfig.extra.authDomain,
      projectId: Constants.expoConfig.extra.projectId,
      storageBucket: Constants.expoConfig.extra.storageBucket,
      messagingSenderId: Constants.expoConfig.extra.messagingSenderId,
      appId: Constants.expoConfig.extra.appId,
      databaseURL: Constants.expoConfig.extra.databaseURL,
    };

    const firebaseApp = initializeApp(firebaseConfig);
    getAuth(firebaseApp);
    getFirestore(firebaseApp);
    getAnalytics(firebaseApp);
  };

  const checkOpenCageAPI = async () => {
    // 5. Verificación ligera de OpenCage
    if (!OPENCAGE_API_KEY) return;
    
    const { default: axios } = await import('axios');
    await axios.get('https://api.opencagedata.com/geocode/v1/json', {
      params: {
        key: OPENCAGE_API_KEY,
        q: '0,0',
        no_annotations: 1,
        limit: 0
      },
      timeout: 3000 // 6. Timeout para evitar esperas largas
    });
  };

  if (error) {
    return (
      <View style={styles.container} onLayout={onLayoutRootView}>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.instructions}>
          Por favor, reinicia la aplicación. Si el problema persiste, contacta al soporte técnico.
        </Text>
      </View>
    );
  }

  if (!initialized) {
    return (
      <View style={styles.container} onLayout={onLayoutRootView}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Cargando aplicación...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      {children}
    </View>
  );
};

// 7. Estilos optimizados con memoización
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#333'
  },
  errorText: {
    color: 'red',
    fontSize: 18,
    marginBottom: 15,
    textAlign: 'center'
  },
  instructions: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center'
  }
});

export default React.memo(AppInitializer);
"use client"

import { useState, useRef, useEffect } from "react"
import { Modal, View, Button, StyleSheet, Text, ActivityIndicator } from "react-native"
import { WebView } from "react-native-webview"
import { reverseGeocode, injectLeafletScript } from "./geocode"

const MapModal = ({ isVisible, onClose, onLocationSelect }) => {
  const [position, setPosition] = useState({
    latitude: 32.5149,
    longitude: -117.0382, // Tijuana
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const webViewRef = useRef(null)

  // HTML template para el mapa Leaflet
  const htmlTemplate = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Leaflet Map</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
        <style>
          body { margin: 0; padding: 0; }
          #map { height: 100vh; width: 100vw; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
        <script>
          let map;
          let marker;
          let clickListener;
          
          function initMap(lat, lng) {
            try {
              map = L.map('map').setView([lat, lng], 13);
              
              L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              }).addTo(map);
              
              marker = L.marker([lat, lng], {draggable: true}).addTo(map);
              
              // Escuchar clics en el mapa
              clickListener = map.on('click', function(e) {
                const { lat, lng } = e.latlng;
                marker.setLatLng([lat, lng]);
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'locationSelected',
                  latitude: lat,
                  longitude: lng
                }));
              });
              
              // Escuchar arrastre del marcador
              marker.on('dragend', function(e) {
                const { lat, lng } = e.target.getLatLng();
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'locationSelected',
                  latitude: lat,
                  longitude: lng
                }));
              });
              
              // Notificar que el mapa se cargó correctamente
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'mapLoaded'
              }));
            } catch (error) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'error',
                message: error.toString()
              }));
            }
          }
          
          function updateMarkerPosition(lat, lng) {
            if (marker) {
              marker.setLatLng([lat, lng]);
              map.setView([lat, lng]);
            }
          }
        </script>
      </body>
    </html>
  `

  // Inicializar el mapa cuando se monta el WebView
  useEffect(() => {
    if (isVisible && webViewRef.current) {
      setError(null)
      const script = `
        try {
          initMap(${position.latitude}, ${position.longitude});
        } catch(e) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'error',
            message: e.toString()
          }));
        }
        true; // Necesario para iOS
      `
      setTimeout(() => injectLeafletScript(webViewRef, script), 500)
    }
  }, [isVisible])

  const handleMessage = async (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data)

      if (data.type === "error") {
        console.error("Error en WebView:", data.message)
        setError(`Error en el mapa: ${data.message}`)
        return
      }

      if (data.type === "mapLoaded") {
        console.log("Mapa cargado correctamente")
        return
      }

      if (data.type === "locationSelected") {
        const { latitude, longitude } = data
        setPosition({ latitude, longitude })
        setLoading(true)
        setError(null)

        console.log(`Punto seleccionado: ${latitude}, ${longitude}`)
        try {
          const address = await reverseGeocode(latitude, longitude)
          console.log(`Geocodificación exitosa: ${address}`)
          // Siempre pasamos la dirección obtenida, sin mostrar mensajes de error en la UI
          onLocationSelect({
            latitude,
            longitude,
            address: address,
          })
          setError(null) // Limpiar cualquier error previo
        } catch (error) {
          console.warn("Error en geocodificación:", error.message)
          // Aún con error, pasamos las coordenadas como dirección de respaldo
          const fallbackAddress = `Ubicación: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
          onLocationSelect({
            latitude,
            longitude,
            address: fallbackAddress,
          })
          // Opcionalmente mostrar el error en la UI, pero ya hemos pasado una dirección válida
          setError(`Nota: Se usaron coordenadas como respaldo. ${error.message}`)
        } finally {
          setLoading(false)
        }
      }
    } catch (error) {
      console.error("Error al procesar mensaje:", error)
      setError(`Error al procesar datos: ${error.message}`)
      setLoading(false)
    }
  }

  return (
    <Modal visible={isVisible} animationType="slide" transparent>
      <View style={styles.container}>
        <WebView
          ref={webViewRef}
          originWhitelist={["*"]}
          source={{ html: htmlTemplate }}
          style={styles.map}
          javaScriptEnabled={true}
          onMessage={handleMessage}
          startInLoadingState={true}
          onError={(e) => setError(`Error de WebView: ${e.nativeEvent.description}`)}
        />
        <View style={styles.buttonContainer}>
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#0000ff" />
              <Text style={styles.loadingText}>Obteniendo dirección...</Text>
            </View>
          )}
          {error && <Text style={styles.errorText}>{error}</Text>}
          <Button title="Cerrar" onPress={onClose} />
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
  },
  map: {
    flex: 1,
    width: "100%",
  },
  buttonContainer: {
    padding: 20,
    backgroundColor: "white",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  loadingText: {
    marginLeft: 10,
  },
  errorText: {
    color: "red",
    marginBottom: 10,
  },
})

export default MapModal


import axios from "axios"

const API_KEY = "d513eeb858f34ef7bbfaaeab1c8d928a" // Ensure this key is valid and has not exceeded usage limits

const reverseGeocode = async (latitude, longitude) => {
  try {
    console.log(`Iniciando geocodificación inversa: ${latitude}, ${longitude}`)

    // Validar coordenadas
    if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
      throw new Error("Coordenadas inválidas")
    }

    const response = await axios.get("https://api.opencagedata.com/geocode/v1/json", {
      params: {
        key: API_KEY,
        q: `${latitude},${longitude}`,
        language: "es",
        no_annotations: 1,
        limit: 1,
      },
    })

    // Verificar el estado de la API
    if (response.data.status && response.data.status.code !== 200) {
      console.error("Error API OpenCage:", response.data.status.message)
      throw new Error(`Error API: ${response.data.status.message}`)
    }

    // Verificar si hay resultados
    if (response.data.results && response.data.results.length > 0) {
      const result = response.data.results[0]
      console.log("Resultado geocodificación:", result)

      // Extraer componentes de dirección con manejo de valores nulos
      const components = result.components || {}
      const road = components.road || components.street || components.pedestrian || ""
      const houseNumber = components.house_number || ""
      const city = components.city || components.town || components.village || components.municipality || ""
      const state = components.state || ""

      // Construir dirección formateada
      let formattedAddress
      if (result.formatted) {
        formattedAddress = result.formatted
      } else {
        formattedAddress =
          road + (houseNumber ? ` ${houseNumber}` : "") + (city ? `, ${city}` : "") + (state ? `, ${state}` : "")
      }

      // Si no hay dirección formateada, usar las coordenadas
      if (!formattedAddress || formattedAddress.trim() === "") {
        formattedAddress = `Ubicación: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
      }

      console.log("Dirección formateada:", formattedAddress)
      return formattedAddress
    }

    console.warn("No se encontraron resultados de geocodificación")
    return `Ubicación: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
  } catch (error) {
    // Mejorar el registro de errores
    console.error("Error en geocodificación inversa:", error.message)
    if (error.response) {
      console.error("Respuesta de error:", error.response.data)
      console.error("Estado HTTP:", error.response.status)
    }

    // Devolver las coordenadas como respaldo
    return `Ubicación: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
  }
}

const injectLeafletScript = (webViewRef, script) => {
  webViewRef.current?.injectJavaScript(script)
}

export { reverseGeocode, injectLeafletScript }


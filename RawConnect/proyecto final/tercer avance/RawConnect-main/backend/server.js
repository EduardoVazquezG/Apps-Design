require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const URL = 'http://192.168.0.127'; // CAMBIAR LA IP A LA DE TU COMPUTADORA


// Configuración de middlewares
app.use(cors());
app.use(express.json());

// Middleware de logging para todas las solicitudes
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.get('/checkout/complete', (req, res) => {
  res.send('Pago completado, puede cerrar esta ventana.');
});

app.get('/checkout/cancel', (req, res) => {
  res.send('Pago cancelado, puede cerrar esta ventana.');
});


// Función para obtener token de PayPal
const getPayPalAccessToken = async () => {
  try {
    console.log('[PayPal] Obteniendo token de acceso...');
    const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`).toString('base64');
    
    const response = await axios.post(
      'https://api-m.sandbox.paypal.com/v1/oauth2/token',
      'grant_type=client_credentials',
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    console.log('[PayPal] Token obtenido con éxito');
    return response.data.access_token;

  } catch (error) {
    console.error('[PayPal] Error al obtener token:', error.response?.data || error.message);
    throw error;
  }
};

// Ruta para crear pagos
app.post('/create-payment', async (req, res) => {
  try {
    console.log('[Create Payment] Body recibido:', req.body);
    
    const { amount } = req.body;
    if (!amount || isNaN(amount)) {
      console.error('[Create Payment] Monto inválido:', amount);
      return res.status(400).json({ error: 'Monto inválido' });
    }

    const accessToken = await getPayPalAccessToken();
    console.log('[Create Payment] Creando orden en PayPal...');

    const response = await axios.post(
      'https://api-m.sandbox.paypal.com/v2/checkout/orders',
      {
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'MXN',
            value: Number(amount).toFixed(2)
          }
        }],
        application_context: {
          return_url: `${URL}:3001/checkout/complete`, // URL a la que redirige PayPal en caso de éxito
          cancel_url: `${URL}:3001/checkout/cancel`    // URL en caso de cancelación
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    

    console.log('[Create Payment] Orden creada:', response.data.id);
    const approvalLink = response.data.links.find(link => link.rel === 'approve');

    res.json({
      paymentId: response.data.id,
      approvalUrl: approvalLink.href
    });

  } catch (error) {
    console.error('[Create Payment] Error crítico:', {
      message: error.message,
      response: error.response?.data,
      stack: error.stack
    });
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Ruta para ejecutar pagos
app.post('/execute-payment', async (req, res) => {
  try {
    console.log('[Execute Payment] Ejecutando pago:', req.body);
    
    const { paymentId, payerId } = req.body;
    const accessToken = await getPayPalAccessToken();

    const response = await axios.post(
      `https://api-m.sandbox.paypal.com/v2/checkout/orders/${paymentId}/capture`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const captureData = response.data;
    // Extraer el total de forma segura desde la primera unidad de compra
    let total = null;
    if (
      captureData.purchase_units &&
      captureData.purchase_units.length > 0 &&
      captureData.purchase_units[0].payments &&
      captureData.purchase_units[0].payments.captures &&
      captureData.purchase_units[0].payments.captures.length > 0
    ) {
      total = captureData.purchase_units[0].payments.captures[0].amount?.value;
    }
    
    if (!total) {
      throw new Error("No se pudo extraer el total de la transacción");
    }
    
    // Extraer el correo del comprador
    const payerEmail = captureData.payer?.email_address || null;
    
    console.log('[Execute Payment] Pago completado:', captureData.id);
    // Devolver un objeto plano con las propiedades necesarias
    res.json({ 
      success: true, 
      data: { 
        id: captureData.id, 
        total, 
        payer_email: payerEmail,
        // Se pueden incluir otras propiedades relevantes si se requiere
        ...captureData 
      } 
    });

  } catch (error) {
    console.error('[Execute Payment] Error:', {
      message: error.message,
      response: error.response?.data,
      stack: error.stack
    });
    res.status(500).json({ success: false, error: 'Error al procesar pago' });
  }
});


// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('[Global Error]', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Iniciar servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`=================================`);
  console.log(`🚀 Servidor iniciado en puerto ${PORT}`);
  console.log(`🔑 PayPal Client ID: ${process.env.PAYPAL_CLIENT_ID ? 'Configurado' : 'NO CONFIGURADO'}`);
  console.log(`=================================`);
});
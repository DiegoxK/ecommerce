export const validateSignature = (req: RequestWithBody, res: Response) => {
  // Variables recibidas desde ePayco
  const {
    x_ref_payco,
    x_transaction_id,
    x_amount,
    x_currency_code,
    x_signature,
    x_cod_response,
  } = req.body.data;

  // Valores de configuración de ePayco
  const p_cust_id_cliente = env.P_CUST_ID_CLIENTE;
  const p_key = env.P_KEY;

  // Obtener invoice y valor en el sistema del comercio
  // const numOrder = '2531'; // Este valor es un ejemplo y debe ser reemplazado con el número de orden registrado en tu sistema
  // const valueOrder = '10000'; // Este valor es un ejemplo y debe ser reemplazado con el valor esperado según el número de orden en tu sistema

  //TODO: Comparar invoice value with x_ref_payco and x_amount desde el modelo de orders

  // Calcular la firma
  const signature = createHash("sha256")
    .update(
      p_cust_id_cliente +
        "^" +
        p_key +
        "^" +
        x_ref_payco +
        "^" +
        x_transaction_id +
        "^" +
        x_amount +
        "^" +
        x_currency_code
    )
    .digest("hex");

  // Validar la firma y otros datos
  if (x_signature === signature) {
    // La firma es válida, puedes verificar el estado de la transacción
    switch (parseInt(x_cod_response)) {
      case 1:
        res.status(200).send("Transacción aceptada");
        break;
      case 2:
        res.status(403).send("Transacción rechazada");
        break;
      case 3:
        res.status(202).send("Transacción pendiente");
        break;
      case 4:
        res.status(500).send("Transacción fallida");
        break;
      default:
        res.status(500).send("Estado de transacción desconocido");
        break;
    }
  } else {
    res.status(400).send("Firma no válida");
  }
};

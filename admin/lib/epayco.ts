export const url_apify = "https://apify.epayco.co";

const public_key = process.env.PUBLIC_KEY;
const private_key = process.env.PRIVATE_KEY;

interface AuthToken {
  token?: string;
}

export const getAuthToken = async () => {
  const credentials = Buffer.from(`${public_key}:${private_key}`).toString(
    "base64"
  );

  const requestOptions = {
    method: "POST",
    headers: new Headers({
      "Content-Type": "application/json",
      Authorization: `Basic ${credentials}`,
    }),
    body: JSON.stringify({}),
    redirect: "follow" as RequestRedirect,
  };

  try {
    const response = await fetch(`${url_apify}/login`, requestOptions);

    if (!response.ok) {
      throw new Error("Error en la solicitud");
    }

    const authToken: AuthToken = await response.json();

    return authToken?.token;
  } catch (error) {
    console.error("Error getting the Session Id:", error);
  }
};

// interface RequestWithBody extends Request {
//   body: {
//     data: {
//       x_ref_payco: string;
//       x_transaction_id: string;
//       x_amount: string;
//       x_currency_code: string;
//       x_signature: string;
//       x_cod_response: string;
//     };
//   };
// }

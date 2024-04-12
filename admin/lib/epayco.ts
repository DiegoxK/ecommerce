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

export const generateInvoiceCode = () => {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const prefix =
    letters.charAt(Math.floor(Math.random() * 26)) +
    letters.charAt(Math.floor(Math.random() * 26)) +
    letters.charAt(Math.floor(Math.random() * 26));
  const number = Math.floor(Math.random() * 10000);
  const paddedNumber = number.toString().padStart(4, "0");

  return `${prefix}-${paddedNumber}`;
};

export const validateIp = (ip: string) => {
  const ipRegex =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

  const privateIpRanges = [
    /^0\..*/, // 0.0.0.0/8
    /^127\..*/, // 127.0.0.0/8
    /^10\..*/, // 10.0.0.0/8
    /^172\.(1[6-9]|2[0-9]|3[0-1])\..*/, // 172.16.0.0/12
    /^192\.168\..*/, // 192.168.0.0/16
  ];

  if (!ipRegex.test(ip)) return false;

  for (const range of privateIpRanges) {
    if (range.test(ip)) return false;
  }

  return true;
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

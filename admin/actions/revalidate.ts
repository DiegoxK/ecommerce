interface RevalidateResponse {
  revalidated: boolean;
}

export const revalidate = async (): Promise<RevalidateResponse> => {
  const res = await fetch(
    `${process.env.NEXT_CLIENT_URL}/api/revalidate?path=/&token=${process.env.REVALIDATE_TOKEN}`
  );

  return res.json();
};

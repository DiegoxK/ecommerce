interface RevalidateResponse {
  revalidated: boolean;
}

export const revalidate = async (): Promise<RevalidateResponse> => {
  // TODO: USE ENV VARIABLES
  const res = await fetch(
    "http://localhost:3000/api/revalidate?path=/&token=f98c602110bba9993482f2efa86f53e30ff1ec525b6d7bcd0f1c5a8016fbdd21"
  );

  return res.json();
};

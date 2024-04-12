import axios from "axios";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function getIp() {
  try {
    const { data } = await axios.get<{
      ip: string;
    }>("https://api.ipify.org?format=json");
    return data.ip;
  } catch (error) {
    console.error("Error while fetching ip", error);
    return "";
  }
}

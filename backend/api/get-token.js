import axios from "axios";

const token = async () => {
    try {
    const res = await axios.get("https://dramabox-token.vercel.app/token");
    return res.data;
    } catch (error) {
        console.error('Error fetching token:', error);
        throw error;
    }
}

export { token };
export default { token };
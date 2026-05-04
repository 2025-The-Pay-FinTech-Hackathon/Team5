import axios from 'axios';

const API_KEY = import.meta.env.VITE_AZURE_VISION_API_KEY;
const ENDPOINT = import.meta.env.VITE_AZURE_VISION_ENDPOINT;

const mockProcessReceiptImage = async () => new Promise((resolve) => {
  setTimeout(() => {
    resolve({
      storeName: '샘플 상점',
      date: '2024-03-15',
      items: [
        { name: '아메리카노', price: 4500, quantity: 1 },
        { name: '카페라떼', price: 5000, quantity: 1 },
        { name: '간식', price: 3500, quantity: 2 },
      ],
      totalAmount: 16500,
    });
  }, 700);
});

const fileToBase64 = (imageFile) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result.split(',')[1]);
  reader.onerror = reject;
  reader.readAsDataURL(imageFile);
});

export const processReceiptImage = async (imageFile) => {
  if (!API_KEY || !ENDPOINT) {
    return mockProcessReceiptImage(imageFile);
  }

  try {
    const base64Image = await fileToBase64(imageFile);
    const response = await axios.post(
      `${ENDPOINT}/vision/v3.2/read/analyze`,
      { url: `data:image/jpeg;base64,${base64Image}` },
      {
        headers: {
          'Content-Type': 'application/json',
          'Ocp-Apim-Subscription-Key': API_KEY,
        },
      },
    );

    const operationLocation = response.headers['operation-location'];
    const operationId = operationLocation.split('/').pop();

    let result;
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const statusResponse = await axios.get(
        `${ENDPOINT}/vision/v3.2/read/analyzeResults/${operationId}`,
        { headers: { 'Ocp-Apim-Subscription-Key': API_KEY } },
      );

      if (statusResponse.data.status === 'succeeded') {
        result = statusResponse.data;
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    if (!result) {
      throw new Error('OCR 처리 시간이 초과되었습니다.');
    }

    const textLines = result.analyzeResult.readResults[0].lines;
    const receiptData = {
      storeName: textLines[0]?.text || '',
      date: '',
      items: [],
      totalAmount: 0,
    };

    const dateRegex = /\d{4}[-/.]\d{1,2}[-/.]\d{1,2}/;
    const amountRegex = /(\d{1,3}(,\d{3})+|\d+)/g;

    for (const line of textLines) {
      const dateMatch = line.text.match(dateRegex);
      if (dateMatch && !receiptData.date) {
        receiptData.date = dateMatch[0].replace(/[/.]/g, '-');
      }

      const amounts = line.text.match(amountRegex);
      if (amounts) {
        const parsedAmounts = amounts
          .map((amount) => Number(amount.replace(/[^0-9]/g, '')))
          .filter((amount) => amount > 0);

        if (parsedAmounts.length > 0) {
          receiptData.totalAmount = parsedAmounts[parsedAmounts.length - 1];
        }
      }
    }

    return receiptData;
  } catch (error) {
    console.error('OCR 처리 중 오류가 발생했습니다:', error);
    throw error;
  }
};

export const webWorkerEval = (code: string): Promise<object> => {
  const bootstrapped = `
    onmessage = () => {
      ${code}
      postMessage(main);
    };
  `;

  const blob = new Blob([bootstrapped], { type: 'application/javascript' });
  const worker = new Worker(URL.createObjectURL(blob));

  return new Promise(resolve => {
    worker.postMessage('start');
    worker.onmessage = (e: MessageEvent<any>) => {
      resolve(e.data);
    };
  });
};
export async function downloadBookletPdf(url: string, filename = 'simplybiznest-booklet.pdf'): Promise<void> {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/pdf',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Unable to download PDF (status ${response.status}).`);
  }

  const blob = await response.blob();
  if (!blob || blob.size < 1024) {
    throw new Error('Generated PDF was empty or incomplete.');
  }

  const pdfBlob = new Blob([blob], { type: 'application/pdf' });
  const objectUrl = URL.createObjectURL(pdfBlob);
  try {
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.rel = 'noopener noreferrer';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
  }
}

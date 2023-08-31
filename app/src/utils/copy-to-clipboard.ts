function fallbackCopy(text: string): boolean {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
        document.execCommand('copy');
    } catch (err) {
        return false;
    } finally {
        document.body.removeChild(textArea);
    }
    return true;
}

export async function copyToClipboard(text: string): Promise<boolean> {
    if (navigator.clipboard?.writeText) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            return fallbackCopy(text);
        }
    } else {
        return fallbackCopy(text);
    }
}
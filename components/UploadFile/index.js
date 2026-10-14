export default function UploadFile() {
    return `
        <div class="upload-area">
            <div class="upload-area__icon">📊</div>
            <p class="upload-area__text">Ou importe via Planilha (.csv)</p>
            <input type="file" id="csv-file" accept=".csv" class="upload-area__input" />
        </div>
    `
}

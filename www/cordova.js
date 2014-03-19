var cordova = {
    plugins: {
        barcodeScanner: {
            scan: function(success, fail){
                var barcode = prompt('barcode :');
                if(barcode == null){
                    success({ text: null, format: null, cancelled: true });
                } else {
                    success({ text: barcode, format: 'text', cancelled: false });
                }
            }
        }
    }
}
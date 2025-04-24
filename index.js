// Dependencia para descompresión (asegúrate de tener `pako` instalada)
const pako = require("pako");

// Convertir Base64 a Uint8Array
function base64ToUint8Array(base64) {
    let binaryString = atob(base64);
    let bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

// Convertir Uint8Array a Base64
function uint8ArrayToBase64(uint8Array) {
    let binaryString = String.fromCharCode(...uint8Array);
    return btoa(binaryString);
}

// Implementación de d67
function d67(data, b) {
    let buffer = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) {
        buffer[i] = data[i] ^ (b >> 8) & 255;
        b = (b + data[i]) * 23219 + 36126 & 65535;
    }
    return buffer;
}

// Clase TCPPacketReader
class TCPPacketReader {
    static badChars = [
        "\u00A0", "\u00AD", "\u009d", "\r\n", "\r", "\n", "\x0B", "\x0C",
        "\x00cc\x00b8", "͋"
    ];

    constructor(bytes) {
        this.position = 0;
        this.data = new Uint8Array(bytes);
        this.view = new DataView(this.data.buffer);
    }

    get remaining() {
        return this.data.length - this.position;
    }
    readUShort() {
        let tmp = this.view.getUint16(this.position, true); 
        this.position += 2;
        return tmp;
    }


    skipByte() {
        this.position++;
    }

    skipBytes(count) {
        this.position += count;
    }

    readBytes(count) {
        let tmp = this.data.slice(this.position, this.position + count);
        this.position += count;
        return tmp;
    }

    readString() {
        let split = this.data.indexOf(0, this.position);
        let tmp = split > -1
            ? this.data.slice(this.position, split)
            : this.data.slice(this.position);
        this.position = split > -1 ? split + 1 : this.data.length;

        let str = new TextDecoder().decode(tmp);

        TCPPacketReader.badChars.forEach(c => {
            str = str.replace(new RegExp(c, "g"), "");
        });

        return str.trim();
    }
}
// Función para convertir bytes en dirección IP
function bytesToIP(bytes) {
    return Array.from(bytes).join(".");
}



// Datos de prueba 
// cortar el string apartir de "arlnk://"  Hashlink.substr(8) 
let hashlink = "F5fPxdTq8eJeuqSVejGmqxY/i++OxhsRmvrAhnyP/hcW9+D59xU0P9rMm7UOwWWQPTcU8c8="; 

// Proceso de decodificación
let buf = base64ToUint8Array(hashlink); // Convertir de Base64 a bytes
buf = d67(buf, 28435); // Aplicar d67
buf = pako.inflate(buf); // Descomprimir con zlib

// Procesar paquete
let packet = new TCPPacketReader(buf);
packet.skipBytes(32);

let room = {};
room.IP = bytesToIP(packet.readBytes(4)); // Conversión correcta de IP
room.Port = packet.readUShort(); // Conversión correcta de puerto
packet.skipBytes(4);
room.Name = packet.readString();


// Mostrar resultados
console.log("Room Info:", {
    IP: room.IP, 
    Port: room.Port,
    Name: room.Name
});

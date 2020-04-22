const Busboy = require("busboy");


/**
 * fileParser middleware
 * 
 * enctype="multipart/form-data" 형태의 파일이 포함된 폼 데이터를 파싱해준다.
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const fileParser = (req, res, next) => {
    const busboy = new Busboy({ headers: req.headers });

    // 데이터를 담을 placeholder
    var files = {};
    req.body = {};

    // 파일 처리
    busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
        console.log(`File [${fieldname}] filename: ${filename}, encoding: ${encoding}, mimetype: ${mimetype}`);
        files[filename] = {
            filename,
            encoding,
            mimetype,
        };

        file.on("data", data => {
            console.log("File [" + fieldname + "] got " + data.length + " bytes");
            files[filename].buffer = Buffer.from(data);
        });
    });

    // 필드 처리
    busboy.on("field", (fieldname, value) => {
        if (fieldname.includes("[]")) {
            let name = fieldname.replace('[]', '');
            if (req.body[name]) {
                req.body[name].push(value);
            }
            else {
                req.body[name] = [value];
            }
        }
        else {
            req.body[fieldname] = value;
        }
    });

    // This callback will be invoked after all uploaded files are saved.
    busboy.on("finish", () => {
        req.files = files;
        next();
    });

    // The raw bytes of the upload will be in req.rawBody.  Send it to busboy, and get
    // a callback when it's finished.
    busboy.end(req.rawBody);
};


module.exports = {
    fileParser,
};
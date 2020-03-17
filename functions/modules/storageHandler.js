/* google stroage handler */
const admin = require("firebase-admin");
const { v4: uuidv4 } = require("uuid");
const stream = require("stream");
const storage = admin.storage();
const bucket = storage.bucket(); // storage의 bucket object 생성

/**
 * upload
 * storage에 파일을 업로드한다
 * 
 * @param {Object} fileObj 업로드될 file object
 * @param {String} fileFullPath storage에서의 fullpath (경로+파일이름.확장자)
 * 
 * @return {Promise} 성공하면 access url을 resolve하는 promise
 */
const upload = (fileObj, fileFullPath) => {
    const bufferStream = new stream.PassThrough();
    bufferStream.end(fileObj.buffer);

    const file = bucket.file(`${fileFullPath}`);
    const uuid = uuidv4();

    // file upload 동작을 promise로 만든다
    return new Promise((resolve, reject) => {
        bufferStream
            .pipe(
                file.createWriteStream({
                    metadata: {
                        contentType: fileObj.mimetype,
                        firebaseStorageDownloadTokens: uuid,
                    },
                    resumable: false,
                })
            )
            .on("error", err => reject(err))
            .on("finish", () => {
                // uuid를 이용한 토큰 액세스 방식
                // https://stackoverflow.com/questions/42956250/get-download-url-from-file-uploaded-with-cloud-functions-for-firebase
                resolve(`https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(file.name)}?alt=media&token=${uuid}`);
            });
    });
};

module.exports = {
    upload,
};

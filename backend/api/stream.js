import axios from "axios";
import { token } from "./get-token.js";

export async function getStreamLink(bookId, episodeIndex) {
    try {
        const gettoken = await token();
        const url = "https://sapi.dramaboxdb.com/drama-box/chapterv2/batch/load";

        const headers = {
            "User-Agent": "okhttp/4.10.0",
            "Accept-Encoding": "gzip",
            "Content-Type": "application/json",
            "tn": `Bearer ${gettoken.token}`,
            "version": "430",
            "vn": "4.3.0",
            "cid": "DRA1000000",
            "package-name": "com.storymatrix.drama",
            "apn": "1",
            "device-id": gettoken.deviceid,
            "language": "in",
            "current-language": "in",
            "p": "43",
            "time-zone": "+0800",
            "content-type": "application/json; charset=UTF-8"
        };

        const data = {
            boundaryIndex: 0,
            comingPlaySectionId: -1,
            index: episodeIndex,
            currencyPlaySource: "discover_new_rec_new",
            needEndRecommend: 0,
            currencyPlaySourceName: "",
            preLoad: false,
            rid: "",
            pullCid: "",
            loadDirection: 0,
            startUpKey: "",
            bookId: bookId
        };

        const response = await axios.post(url, data, { headers });
        const chapterData = response.data.data;

        // Ambil link streaming dari episode yang diminta
        const episode = chapterData.chapterList[0];
        
        if (episode && episode.cdnList && episode.cdnList.length > 0) {
            const streamData = episode.cdnList[0];
            
            // Ambil URL video berdasarkan struktur API asli
            let videoUrl = '';
            
            if (streamData.videoPathList && streamData.videoPathList.length > 0) {
                // Prioritas: 720p > 540p > default > yang pertama
                const quality720 = streamData.videoPathList.find(v => v.quality === 720);
                const quality540 = streamData.videoPathList.find(v => v.quality === 540);
                const defaultQuality = streamData.videoPathList.find(v => v.isDefault === 1);
                
                const selectedQuality = quality720 || defaultQuality || quality540 || streamData.videoPathList[0];
                videoUrl = selectedQuality.videoPath;
            }
            
            return {
                url: videoUrl,
                title: `Episode ${episodeIndex}`,
                duration: 0,
                episodeNumber: episodeIndex,
                qualities: streamData.videoPathList || [],
                cdnDomain: streamData.cdnDomain
            };
        } else {
            throw new Error('Link streaming tidak ditemukan');
        }

    } catch (error) {
        console.error('Error getting stream link:', error);
        throw new Error('Gagal mengambil link streaming');
    }
}
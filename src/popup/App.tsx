import { useEffect, useState } from 'react';
import logo from '/logo.svg';
import './App.css';
import { IPageData, IUpdateMessage } from '../interfaces';
import { BUTTON_TEXT } from './constants';
import { PageList } from './PageList';

const INVALID_ENV_WARNING_CARD: IPageData = {
    profile: 'Please Open as a Chrome Extension',
};

const App = () => {
    const [running, setRunning] = useState(false);
    const [pages, setPages] = useState<IPageData[]>([]);

    const refreshPages = () => {
        // Placeholder for actual implementation
        setPages([INVALID_ENV_WARNING_CARD]); // Read from Storage
    };

    const handleMessage = (message: IUpdateMessage) => {
        if (message.action === 'updatePopup') {
            refreshPages();
        }
    };

    useEffect(() => {
        if (chrome.runtime) {
            refreshPages();
            chrome.runtime.onMessage.addListener(handleMessage);
            return () => chrome.runtime.onMessage.removeListener(handleMessage);
        } else {
            setPages([INVALID_ENV_WARNING_CARD]);
        }
    }, []);

    return (
        <>
            <img src={logo} className="logo" alt="logo" />
            <h2>Sourcing Assistant</h2>
            <div className="header">
                <button onClick={() => setRunning((prevStatus) => !prevStatus)}>
                    {running ? BUTTON_TEXT.RUNNING : BUTTON_TEXT.REST}
                </button>
            </div>
            {running ? <p>RUNNING . . .</p> : <button>DOWNLOAD</button>}
            <PageList pages={pages} />
        </>
    );
};

export default App;

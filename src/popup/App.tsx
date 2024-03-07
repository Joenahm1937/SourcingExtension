import { useEffect, useState } from 'react';
import logo from '/logo.svg';
import './App.css';
import { ICardData } from './interfaces';
import { BUTTON_TEXT, POPUP_SIGNAL, isWorkerMessage } from './constants';
import PageList from './PageList';
import ErrorComponent from './ErrorComponent';
import { IMessage, IPopupMessage, IResponse } from '../interfaces';

const App = () => {
    const [running, setRunning] = useState(false);
    const [pages, setPages] = useState<ICardData[]>([]);
    const [errorMessage, setErrorMessage] = useState<string>();

    useEffect(() => {
        const handleMessage = (message: IMessage) => {
            if (isWorkerMessage(message) && message.signal === 'refresh') {
                // Temporarily passing in data from message
                // We should pull this from local storage instead
                refreshPages(message.data);
            }
        };

        chrome.runtime.onMessage.addListener(handleMessage);
        return () => chrome.runtime.onMessage.removeListener(handleMessage);
    }, []);

    const refreshPages = (data: string) => {
        setPages((prevPages) => [
            ...prevPages,
            {
                profileURL: data,
            },
        ]);
    };

    const toggleScraping = () => {
        const signal = running ? POPUP_SIGNAL.STOP : POPUP_SIGNAL.START;
        const message: IPopupMessage = {
            source: 'Popup',
            signal,
        };
        setRunning(!running);
        chrome.runtime.sendMessage(message, (response: IResponse) => {
            if (response && response.success) {
                setErrorMessage(undefined);
            } else {
                setRunning(!running);
                setErrorMessage(response.message);
            }
        });
    };

    return (
        <>
            <img src={logo} className="logo" alt="logo" />
            <h2>Sourcing Assistant</h2>
            <div className="header">
                <button onClick={toggleScraping}>
                    {running ? BUTTON_TEXT.RUNNING : BUTTON_TEXT.REST}
                </button>
            </div>
            {running ? <p>RUNNING . . .</p> : <button>DOWNLOAD</button>}
            <ErrorComponent message={errorMessage} />
            <PageList pages={pages} />
        </>
    );
};

export default App;

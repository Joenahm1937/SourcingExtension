import { useState } from 'react';
import { ITabData } from '../interfaces';

const PageCard = ({
    url,
    user,
    bioLinkUrls,
    followerCount,
    suggestedProfiles,
    profileImageUrl,
    errorStack,
}: ITabData) => {
    const [errorVisible, setErrorVisible] = useState(false);
    const [suggestionsVisible, setSuggestionsVisible] = useState(false);

    return (
        <li className="tab-card">
            <div>
                <div
                    style={{
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                    onClick={() => chrome.tabs.create({ active: true, url })}
                >
                    <img
                        crossOrigin="anonymous"
                        src={profileImageUrl}
                        style={{ borderRadius: '50%', width: '50%' }} // Smaller size and circular
                    />
                    @{user}
                </div>
                <div>{followerCount}</div>
                <div>
                    {bioLinkUrls?.map((link) => (
                        <div>
                            <a
                                style={{ cursor: 'pointer' }}
                                onClick={() =>
                                    chrome.tabs.create({
                                        active: true,
                                        url: `https://${link}`,
                                    })
                                }
                            >
                                {typeof link === 'string' && link.length >= 15
                                    ? `${link.substring(0, 15)}...`
                                    : link}
                            </a>
                        </div>
                    ))}
                </div>
                {suggestedProfiles ? (
                    <button
                        onClick={() =>
                            setSuggestionsVisible(
                                (prevVisibility) => !prevVisibility
                            )
                        }
                    >
                        Show Suggestions
                    </button>
                ) : (
                    'No suggestions'
                )}
                {suggestionsVisible ? (
                    <div>
                        <h5>Suggested Profiles:</h5>
                        {suggestedProfiles?.map((suggestedProfile) => {
                            return (
                                <div
                                    style={{ cursor: 'pointer' }}
                                    onClick={() =>
                                        chrome.tabs.create({
                                            active: true,
                                            url: suggestedProfile,
                                        })
                                    }
                                >
                                    {getNameFromUrl(suggestedProfile)}
                                </div>
                            );
                        })}
                    </div>
                ) : null}
                {errorStack ? (
                    <button
                        onClick={() =>
                            setErrorVisible((prevVisibility) => !prevVisibility)
                        }
                    >
                        Toggle Error
                    </button>
                ) : null}
                {errorVisible ? <div>{errorStack?.join(',')}</div> : null}
            </div>
        </li>
    );
};

const getNameFromUrl = (url: string): string => {
    const match = url.match(/https:\/\/www\.instagram\.com\/(.+?)\//);
    return match ? match[1] : '';
};

export default PageCard;

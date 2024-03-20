import type { ITabData } from '../interfaces';
import { useState } from 'react';

const TabCard = ({
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
                    className="tab-card-profile"
                    onClick={() => chrome.tabs.create({ active: true, url })}
                >
                    <img
                        crossOrigin="anonymous"
                        src={profileImageUrl}
                        className="tab-card-profile-image"
                    />
                    @{user}
                </div>
                <div>{followerCount}</div>
                <div>
                    {bioLinkUrls?.map((link) => (
                        <div>
                            <a
                                className="tab-card-link"
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
                        {suggestionsVisible
                            ? 'Hide Suggestions'
                            : 'Show Suggestions'}
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
                                    className="suggested-profile"
                                    onClick={() =>
                                        chrome.tabs.create({
                                            active: true,
                                            url: suggestedProfile,
                                        })
                                    }
                                >
                                    {`@${getNameFromUrl(suggestedProfile)}`}
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

export default TabCard;

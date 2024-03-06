import { ICardData } from './interfaces';

const PageCard = ({ profileURL }: ICardData) => (
    <li className="page-card">
        <div>{profileURL}</div>
    </li>
);

export default PageCard;

import { ITabData } from '../interfaces';

const PageCard = ({ name, url }: ITabData) => (
    <li className="tab-card">
        <div>{url}</div>
        <div>{name}</div>
    </li>
);

export default PageCard;

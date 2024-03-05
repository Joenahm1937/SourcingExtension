const ErrorComponent = ({ message }: { message?: string }) => {
    if (!message) return null;
    return <div className="warning">{message}</div>;
};

export default ErrorComponent;

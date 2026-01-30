import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import KycUpload from './pages/KycUpload';

const App: React.FC = () => {
    return (
        <Router>
            <Switch>
                <Route path="/" exact component={KycUpload} />
                <Route path="/dashboard" component={Dashboard} />
            </Switch>
        </Router>
    );
};

export default App;
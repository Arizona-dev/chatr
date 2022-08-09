import React from 'react';
import Snackbar from '@mui/material/Snackbar';
import { Alert } from '@mui/material';
import { logService } from '../../services/log.service';

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            error: null,
            errorInfo: null,
            snackbar: {
                open: false,
                vertical: 'top',
                horizontal: 'center',
            }
        };
        this.handleClose = this.handleClose.bind(this);
        this.handleOpen = this.handleOpen.bind(this);
    }

    componentDidCatch(error, errorInfo) {
        // Catch errors in any components below and re-render with error message
        this.setState({
            error: error,
            errorInfo: errorInfo
        })
        this.handleOpen()
        // You can also log error messages to an error reporting service here
        // logService.sendLogError
        logService.sendLogError({
            level: 'error',
            message: error.message,
            meta: {
                ...errorInfo,
                service: 'client'
            }
        })
    }

    handleOpen() {
        this.setState({
            snackbar: {
                ...this.state.snackbar,
                open: true,
            }
        });
    }

    handleClose() {
        this.setState({
            snackbar: {
                ...this.state.snackbar,
                open: false,
            }
        });
    }

    render() {
        if (this.state.errorInfo) {
            // Error path
            return (
                <>
                    <Snackbar
                        anchorOrigin={{
                            vertical: this.state.snackbar.vertical,
                            horizontal: this.state.snackbar.horizontal,
                        }}
                        open={this.state.snackbar.open}
                        autoHideDuration={10000}
                        onClose={this.handleClose}
                    >
                        <Alert onClose={this.handleClose} severity="error" sx={{ width: '100%' }}>
                            Something went wrong, our team is working on it (~24 hours). Please try later.
                        </Alert>
                    </Snackbar>
                    <></>
                </>
            );
        }
        // Normally, just render children
        return this.props.children;
    }
}
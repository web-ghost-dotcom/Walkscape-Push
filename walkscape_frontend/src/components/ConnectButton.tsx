'use client';

import { PushUniversalAccountButton } from '@pushchain/ui-kit';
import React from 'react';

interface ConnectButtonProps {
    children?: React.ReactNode;
    className?: string;
}

export default function ConnectButton({ children }: ConnectButtonProps) {
    // Extract text from children
    let buttonText = 'Launch App';

    if (children) {
        if (typeof children === 'string') {
            buttonText = children;
        } else if (Array.isArray(children)) {
            // Handle array of children - extract text nodes
            buttonText = children
                .map(child => typeof child === 'string' ? child : '')
                .filter(text => text.trim())
                .join(' ') || 'Launch App';
        } else if (React.isValidElement(children)) {
            // If it's a single React element, check for text content
            buttonText = 'Launch App';
        }
    }

    return (
        <PushUniversalAccountButton
            connectButtonText={buttonText}
            loginAppOverride={{
                title: 'WalkScape',
                description: 'Explore, Collect, Grow on Push Chain',
            }}
        />
    );
}

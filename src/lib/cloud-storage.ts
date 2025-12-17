// Future Implementation: Cloud Storage Integration
// Will support Google Drive and Dropbox

export interface CloudProvider {
    name: 'google-drive' | 'dropbox';
    connect: () => Promise<void>;
    upload: (file: File) => Promise<string>;
}

export const CloudStorage = {
    // TODO: Implement OAuth flows
    connect: async (provider: CloudProvider['name']) => {
        console.log(`Connecting to ${provider}...`);
    }
};

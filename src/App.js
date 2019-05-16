import React, { Component } from 'react';
import { uniqueId } from 'lodash';
import filesize from 'filesize';

import api from './services/api';

import GlobalStyle from './styles/global';
import { Container, Content } from './styles';

import Upload from './components/Upload';
import FileList from './components/FileList';

class App extends Component {

  state = {
    uploadedFiles: [],
  };

  async componentDidMount() {
    const response = await api.get('user/file');

    this.setState({
      uploadedFiles: response.data.map(file => ({
        id: file._id,
        name: file.name,
        readableSize: filesize(file.size),
        preview: file.url,
        uploaded: true,
        url: file.url
      }))
    });
  }

  componentWillUnmount() {
    this.state.uploadedFiles.forEach(file => URL.revokeObjectURL(file.preview));
  }

  handleUpload = (files) => {

    const uploadedFiles = files.map(file => ({
      file,
      id: uniqueId(),
      name: file.name,
      readableSize: filesize(file.size),
      preview: URL.createObjectURL(file),
      progress: 0,
      uploaded: false,
      error: false,
      url: null,
    }))

    this.setState({
      uploadedFiles: this.state.uploadedFiles.concat(uploadedFiles)
    });

    uploadedFiles.forEach(this.processUpload);
  }

  updateFile = (id, data) => {
    this.setState({
      uploadedFiles: this.state.uploadedFiles.map(uploadedFile => {
        return id === uploadedFile.id ? { ...uploadedFile, ...data } : uploadedFile;
      })
    })
  }

  processUpload = async (uploadedFile) => {
    const data = new FormData();

    data.append('file', uploadedFile.file, uploadedFile.name);

    try {
      const response = await api.post('/user/file', data, {
        onUploadProgress: e => {
          const progress = parseInt(Math.round((e.loaded * 100) / e.total))
          this.updateFile(uploadedFile.id, { progress });
        }
      });

      this.updateFile(uploadedFile.id, {
        uploaded: true,
        id: response.data._id,
        url: response.data.url
      });

    } catch (error) {
      this.updateFile(uploadedFile.id, {
        error: true
      });
    }
  }

  handleDelete = async (id) => {
    await api.delete(`user/file/${id}`);
    this.setState({
      uploadedFiles: this.state.uploadedFiles.filter(uploadedFile => {
        return uploadedFile.id !== id;
      })
    });
  }

  render() {

    const { uploadedFiles } = this.state;
    return (
      <Container>
        <Content>
          <Upload onUpload={this.handleUpload} />
          { !!uploadedFiles.length && (
            <FileList files={uploadedFiles} onDelete={this.handleDelete}/>
          )}
        </Content>
        <GlobalStyle />
      </Container>
    );
  }
}

export default App;

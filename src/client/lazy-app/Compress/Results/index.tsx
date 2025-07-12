import { h, Component, Fragment } from 'preact';

import * as style from './style.css';
import 'add-css:./style.css';
import 'shared/custom-els/loading-spinner';
import { SourceImage } from '../';
import prettyBytes from './pretty-bytes';
import { Arrow, DownloadIcon } from 'client/lazy-app/icons';
import { memosApiService } from 'shared/memos-api';
import { settingsManager } from 'shared/settings';
import InputFileNameModal from '../Options/InputFileNameModal';
import type SnackBarElement from 'shared/custom-els/snack-bar';

interface Props {
  loading: boolean;
  source?: SourceImage;
  imageFile?: File;
  downloadUrl?: string;
  flipSide: boolean;
  typeLabel: string;
  showUploadButton?: boolean; // 新增：是否显示上传按钮
  onRequireMemosSettings?: () => void;
  showSnack?: SnackBarElement['showSnackbar'];
}

interface State {
  showLoadingState: boolean;
  uploading: boolean;
  showFileNameModal: boolean;
  pendingUploadFileName: string;
  defaultFileName: string;
}

const loadingReactionDelay = 500;

export default class Results extends Component<Props, State> {
  state: State = {
    showLoadingState: this.props.loading,
    uploading: false,
    showFileNameModal: false,
    pendingUploadFileName: '',
    defaultFileName: '',
  };

  /** The timeout ID between entering the loading state, and changing UI */
  private loadingTimeoutId: number = 0;

  componentDidUpdate(prevProps: Props, prevState: State) {
    if (prevProps.loading && !this.props.loading) {
      // Just stopped loading
      clearTimeout(this.loadingTimeoutId);
      this.setState({ showLoadingState: false });
    } else if (!prevProps.loading && this.props.loading) {
      // Just started loading
      this.loadingTimeoutId = self.setTimeout(
        () => this.setState({ showLoadingState: true }),
        loadingReactionDelay,
      );
    }
  }

  private onDownload = () => {
    if (!this.props.imageFile) return;
    
    // 创建下载链接
    const url = this.props.downloadUrl || URL.createObjectURL(this.props.imageFile);
    const link = document.createElement('a');
    link.href = url;
    
    // 设置文件名
    const originalName = this.props.imageFile.name.replace(/\.[^/.]+$/, '');
    const extension = this.props.imageFile.type.split('/')[1] || 'bin';
    link.download = `${originalName}.${extension}`;
    
    // 触发下载
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // 如果是临时创建的 URL，需要释放
    if (!this.props.downloadUrl) {
      URL.revokeObjectURL(url);
    }
    
    // GA can't do floats. So we round to ints. We're deliberately rounding to nearest kilobyte to
    // avoid cases where exact image sizes leak something interesting about the user.
    const before = Math.round(this.props.source!.file.size / 1024);
    const after = Math.round(this.props.imageFile!.size / 1024);
    const change = Math.round((after / before) * 1000);

    ga('send', 'event', 'compression', 'download', {
      metric1: before,
      metric2: after,
      metric3: change,
    });
  };

  private onUpload = () => {
    if (!this.props.imageFile) return;
    const settings = settingsManager.getSettings();
    const DEFAULT_DOMAIN = 'memos.apidocumentation.com';
    const DEFAULT_TOKEN = 'your-token-here';
    const currentDomain = settings.memosApiUrl
      ? settings.memosApiUrl.replace(/^https?:\/\//, '').replace(/\/api\/v1\/memos$/, '')
      : '';
    const currentToken = (settings.memosToken || '').replace(/^Bearer /, '');
    if (
      !settings.memosApiUrl ||
      !settings.memosToken ||
      currentDomain === DEFAULT_DOMAIN ||
      currentToken === DEFAULT_TOKEN
    ) {
      if (this.props.onRequireMemosSettings) {
        this.props.onRequireMemosSettings();
      } else {
        this.props.showSnack?.('请先配置 Memos API 设置！\n点击设置按钮 ⚙️ 进行配置。', {
          timeout: 5000,
          actions: ['知道了'],
        });
      }
      return;
    }
    
    // 根据文件类型确定后缀名
    const getFileExtension = (file: File): string => {
      const mimeType = file.type;
      switch (mimeType) {
        case 'image/avif': return 'avif';
        case 'image/webp': return 'webp';
        case 'image/jpeg': return 'jpg';
        case 'image/png': return 'png';
        case 'image/jxl': return 'jxl';
        case 'image/webp2': return 'wp2';
        case 'image/qoi': return 'qoi';
        default: {
          // 对于未知类型，尝试从文件名中提取扩展名
          const fileName = file.name;
          const lastDotIndex = fileName.lastIndexOf('.');
          if (lastDotIndex > 0) {
            return fileName.substring(lastDotIndex + 1).toLowerCase();
          }
          return 'bin';
        }
      }
    };
    
    const extension = getFileExtension(this.props.imageFile);
    
    // 生成默认文件名（不带后缀）- 直接使用原文件名
    const originalName = this.props.imageFile!.name.replace(/\.[^/.]+$/, '');
    const defaultFileName = originalName;
    
    // 显示文件名输入弹窗
    this.setState({
      showFileNameModal: true,
      pendingUploadFileName: extension,
      defaultFileName,
    });
  };

  private handleFileNameConfirm = async (inputFileName: string) => {
    const finalFileName = `${inputFileName}.${this.state.pendingUploadFileName}`;
    this.setState({ showFileNameModal: false, uploading: true });
    
    try {
      const content = `${inputFileName}`;
      await memosApiService.uploadImage(this.props.imageFile!, content, false, finalFileName, 'PUBLIC');
      this.props.showSnack?.(`上传成功！生成新 memo: 《${inputFileName}》`, {
        timeout: 4000,
        actions: ['知道了'],
      });
    } catch (error) {
      console.error('上传到 Memos 失败:', error);
      this.props.showSnack?.('上传失败: ' + (error instanceof Error ? error.message : '未知错误'), {
        timeout: 6000,
        actions: ['知道了'],
      });
    } finally {
      this.setState({ uploading: false });
    }
  };

  render(
    { source, imageFile, downloadUrl, flipSide, typeLabel, showUploadButton }: Props,
    { showLoadingState, showFileNameModal, defaultFileName, pendingUploadFileName }: State,
  ) {
    const prettySize = imageFile && prettyBytes(imageFile.size);
    const isOriginal = !source || !imageFile || source.file === imageFile;
    let diff;
    let percent;

    if (source && imageFile) {
      diff = imageFile.size / source.file.size;
      const absolutePercent = Math.round(Math.abs(diff) * 100);
      percent = diff > 1 ? absolutePercent - 100 : 100 - absolutePercent;
    }

    return (
      <div
        class={
          (flipSide ? style.resultsRight : style.resultsLeft) +
          ' ' +
          (isOriginal ? style.isOriginal : '')
        }
      >
        <div class={style.expandArrow}>
          <Arrow />
        </div>
        <div class={style.bubble}>
          <div class={style.bubbleInner}>
            <div class={style.sizeInfo}>
              <div class={style.fileSize}>
                {prettySize ? (
                  <Fragment>
                    {prettySize.value}{' '}
                    <span class={style.unit}>{prettySize.unit}</span>
                    <span class={style.typeLabel}> {typeLabel}</span>
                  </Fragment>
                ) : (
                  '…'
                )}
              </div>
            </div>
            <div class={style.percentInfo}>
              <svg
                viewBox="0 0 1 2"
                class={style.bigArrow}
                preserveAspectRatio="none"
              >
                <path d="M1 0v2L0 1z" />
              </svg>
              <div class={style.percentOutput}>
                {diff && diff !== 1 && (
                  <span class={style.sizeDirection}>
                    {diff < 1 ? '↓' : '↑'}
                  </span>
                )}
                <span class={style.sizeValue}>{percent || 0}</span>
                <span class={style.percentChar}>%</span>
              </div>
            </div>
          </div>
        </div>
        <button
          class={showLoadingState ? style.downloadDisable : style.download}
          disabled={this.state.uploading || showLoadingState}
          onClick={showUploadButton ? this.onUpload : this.onDownload}
        >
          <div class={style.downloadIcon}>
            <DownloadIcon />
          </div>
          {this.state.uploading ? <loading-spinner /> : (showUploadButton ? '上传到 Memos' : '下载')}
        </button>
        {this.state.uploading && (
          <div class={style.uploadStatus}>
            <loading-spinner />
            <span>上传中...</span>
          </div>
        )}
        
        {/* 文件名输入弹窗 */}
        <InputFileNameModal
          open={showFileNameModal}
          defaultFileName={defaultFileName}
          extension={pendingUploadFileName}
          onConfirm={this.handleFileNameConfirm}
          onClose={() => this.setState({ showFileNameModal: false })}
        />
      </div>
    );
  }
}

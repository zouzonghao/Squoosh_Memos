import { h, Component, Fragment } from 'preact';

import * as style from './style.css';
import 'add-css:./style.css';
import 'shared/custom-els/loading-spinner';
import { SourceImage } from '../';
import prettyBytes from './pretty-bytes';
import { Arrow, DownloadIcon } from 'client/lazy-app/icons';
import { memosApiService } from 'shared/memos-api';
import { settingsManager } from 'shared/settings';

interface Props {
  loading: boolean;
  source?: SourceImage;
  imageFile?: File;
  downloadUrl?: string;
  flipSide: boolean;
  typeLabel: string;
  showUploadButton?: boolean; // 新增：是否显示上传按钮
}

interface State {
  showLoadingState: boolean;
  uploading: boolean;
}

const loadingReactionDelay = 500;

export default class Results extends Component<Props, State> {
  state: State = {
    showLoadingState: this.props.loading,
    uploading: false,
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

  private onUpload = async () => {
    if (!this.props.imageFile) return;
    const settings = settingsManager.getSettings();
    if (!settings.memosApiUrl || !settings.memosToken) {
      alert('请先配置 Memos API 设置！\n点击设置按钮 ⚙️ 进行配置。');
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
    
    // 生成默认文件名（不带后缀）
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const originalName = this.props.imageFile!.name.replace(/\.[^/.]+$/, '');
    const defaultFileName = `${year}${month}${day}_${originalName}`;
    
    // 弹窗让用户输入文件名（不带后缀）
    let inputFileName = window.prompt(`请输入上传到 Memos 的文件名（无需加后缀 .${extension}，可含中文）：`, defaultFileName);
    if (!inputFileName) {
      alert('文件名不能为空！');
      return;
    }
    inputFileName = inputFileName.trim().replace(/\s+/g, '_');
    // 允许中文、字母、数字、下划线、短横线
    if (!/^[\u4e00-\u9fa5\w-]+$/.test(inputFileName)) {
      alert('文件名只能包含中文、字母、数字、下划线和短横线！');
      return;
    }
    const finalFileName = `${inputFileName}.${extension}`;
    this.setState({ uploading: true });
    try {
      const content = `${inputFileName}`;
      await memosApiService.uploadImage(this.props.imageFile, content, false, finalFileName, 'PUBLIC');
      alert(`图片上传成功！\n生成新memo: ${inputFileName}`);
    } catch (error) {
      console.error('上传到 Memos 失败:', error);
      alert('上传失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      this.setState({ uploading: false });
    }
  };

  render(
    { source, imageFile, downloadUrl, flipSide, typeLabel, showUploadButton }: Props,
    { showLoadingState }: State,
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
      </div>
    );
  }
}

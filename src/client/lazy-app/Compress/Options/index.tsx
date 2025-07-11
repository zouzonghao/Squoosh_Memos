import { h, Component } from 'preact';

import * as style from './style.css';
import 'add-css:./style.css';
import { cleanSet, cleanMerge } from '../../util/clean-modify';

import type { SourceImage, OutputType } from '..';
import {
  EncoderOptions,
  EncoderState,
  ProcessorState,
  ProcessorOptions,
  encoderMap,
} from '../../feature-meta';
import Expander from './Expander';
import Toggle from './Toggle';
import Select from './Select';
import { Options as QuantOptionsComponent } from 'features/processors/quantize/client';
import { Options as ResizeOptionsComponent } from 'features/processors/resize/client';
import { ImportIcon, SaveIcon, SwapIcon } from 'client/lazy-app/icons';
import { settingsManager } from 'shared/settings';

interface Props {
  index: 0 | 1;
  mobileView: boolean;
  source?: SourceImage;
  encoderState?: EncoderState;
  processorState: ProcessorState;
  onEncoderTypeChange(index: 0 | 1, newType: OutputType): void;
  onEncoderOptionsChange(index: 0 | 1, newOptions: EncoderOptions): void;
  onProcessorOptionsChange(index: 0 | 1, newOptions: ProcessorState): void;
  onCopyToOtherSideClick(index: 0 | 1): void;
  onSaveSideSettingsClick(index: 0 | 1): void;
  onImportSideSettingsClick(index: 0 | 1): void;
}

interface State {
  supportedEncoderMap?: PartialButNotUndefined<typeof encoderMap>;
  leftSideSettings?: string | null;
  rightSideSettings?: string | null;
}

type PartialButNotUndefined<T> = {
  [P in keyof T]: T[P];
};

const supportedEncoderMapP: Promise<PartialButNotUndefined<typeof encoderMap>> =
  (async () => {
    const supportedEncoderMap: PartialButNotUndefined<typeof encoderMap> = {
      ...encoderMap,
    };

    // Filter out entries where the feature test fails
    await Promise.all(
      Object.entries(encoderMap).map(async ([encoderName, details]) => {
        if ('featureTest' in details && !(await details.featureTest())) {
          delete supportedEncoderMap[encoderName as keyof typeof encoderMap];
        }
      }),
    );

    return supportedEncoderMap;
  })();

export default class Options extends Component<Props, State> {
  state: State = {
    supportedEncoderMap: undefined,
    leftSideSettings: localStorage.getItem('leftSideSettings'),
    rightSideSettings: localStorage.getItem('rightSideSettings'),
  };

  constructor() {
    super();
    supportedEncoderMapP.then((supportedEncoderMap) =>
      this.setState({ supportedEncoderMap }),
    );
  }

  private setLeftSideSettings = () => {
    this.setState({
      leftSideSettings: localStorage.getItem('leftSideSettings'),
    });
  };

  private setRightSideSettings = () => {
    this.setState({
      rightSideSettings: localStorage.getItem('rightSideSettings'),
    });
  };

  componentDidMount(): void {
    // Changing the state when side setting is stored in localstorage
    window.addEventListener('leftSideSettings', this.setLeftSideSettings);
    window.addEventListener('rightSideSettings', this.setRightSideSettings);
  }

  componentWillUnmount(): void {
    window.removeEventListener('leftSideSettings', this.setLeftSideSettings);
    window.removeEventListener('rightSideSettings', this.setRightSideSettings);
  }

  private onEncoderTypeChange = (event: Event) => {
    const el = event.currentTarget as HTMLSelectElement;

    // The select element only has values matching encoder types,
    // so 'as' is safe here.
    const type = el.value as OutputType;
    this.props.onEncoderTypeChange(this.props.index, type);
  };

  private onProcessorEnabledChange = (event: Event) => {
    const el = event.currentTarget as HTMLInputElement;
    const processor = el.name.split('.')[0] as keyof ProcessorState;

    this.props.onProcessorOptionsChange(
      this.props.index,
      cleanSet(this.props.processorState, `${processor}.enabled`, el.checked),
    );
  };

  private onQuantizerOptionsChange = (opts: ProcessorOptions['quantize']) => {
    this.props.onProcessorOptionsChange(
      this.props.index,
      cleanMerge(this.props.processorState, 'quantize', opts),
    );
  };

  private onResizeOptionsChange = (opts: ProcessorOptions['resize']) => {
    this.props.onProcessorOptionsChange(
      this.props.index,
      cleanMerge(this.props.processorState, 'resize', opts),
    );
  };

  private onEncoderOptionsChange = (newOptions: EncoderOptions) => {
    this.props.onEncoderOptionsChange(this.props.index, newOptions);
  };

  private onCopyToOtherSideClick = () => {
    this.props.onCopyToOtherSideClick(this.props.index);
  };

  private onSaveSideSettingClick = () => {
    this.props.onSaveSideSettingsClick(this.props.index);
  };

  private onImportSideSettingsClick = () => {
    this.props.onImportSideSettingsClick(this.props.index);
  };

  private onSettingsClick = () => {
    const settings = settingsManager.getSettings();
    
    // 从完整 API 地址中提取域名部分用于显示
    let currentDomain = '';
    if (settings.memosApiUrl) {
      try {
        const url = new URL(settings.memosApiUrl);
        currentDomain = url.hostname;
      } catch (e) {
        // 如果解析失败，尝试直接提取域名部分
        currentDomain = settings.memosApiUrl.replace(/^https?:\/\//, '').replace(/\/api\/v1\/memos?$/, '');
      }
    }
    
    // 从完整 token 中提取纯 token 部分用于显示
    let currentToken = settings.memosToken || '';
    if (currentToken.startsWith('Bearer ')) {
      currentToken = currentToken.substring(7);
    }
    
    const newDomain = prompt('请输入 Memos 域名（如：memos.apidocumentation.com）:', currentDomain);
    if (newDomain !== null) {
      const newToken = prompt('请输入 Memos Token（无需加 Bearer 前缀）:', currentToken);
      if (newToken !== null) {
        // 自动拼接完整的 API 地址
        const fullApiUrl = `https://${newDomain.replace(/^https?:\/\//, '')}/api/v1/memos`;
        // 自动添加 Bearer 前缀
        const fullToken = newToken.trim() ? `Bearer ${newToken.trim()}` : '';
        
        settingsManager.updateSettings({
          memosApiUrl: fullApiUrl,
          memosToken: fullToken
        });
        alert('设置已保存！');
      }
    }
  };

  render(
    { source, encoderState, processorState }: Props,
    { supportedEncoderMap }: State,
  ) {
    const encoder = encoderState && encoderMap[encoderState.type];
    const EncoderOptionComponent =
      encoder && 'Options' in encoder ? encoder.Options : undefined;

    return (
      <div
        class={
          style.optionsScroller +
          ' ' +
          (encoderState ? '' : style.originalImage)
        }
      >
        <Expander>
          {!encoderState ? null : (
            <div>
              <h3 class={style.optionsTitle}>
                <div class={style.titleAndButtons}>
                  Edit
                  <button
                    class={style.copyOverButton}
                    title="Copy settings to other side"
                    onClick={this.onCopyToOtherSideClick}
                  >
                    <SwapIcon />
                  </button>
                  <button
                    class={style.saveButton}
                    title="Save side settings"
                    onClick={this.onSaveSideSettingClick}
                  >
                    <SaveIcon />
                  </button>
                  <button
                    class={
                      style.importButton +
                      ' ' +
                      (!this.state.leftSideSettings && this.props.index === 0
                        ? style.buttonOpacity
                        : '') +
                      ' ' +
                      (!this.state.rightSideSettings && this.props.index === 1
                        ? style.buttonOpacity
                        : '')
                    }
                    title="Import saved side settings"
                    onClick={this.onImportSideSettingsClick}
                    disabled={
                      // Disabled if this side's settings haven't been saved
                      (!this.state.leftSideSettings &&
                        this.props.index === 0) ||
                      (!this.state.rightSideSettings && this.props.index === 1)
                    }
                  >
                    <ImportIcon />
                  </button>
                  <button
                    class={style.settingsButton}
                    title="Memos 设置"
                    onClick={this.onSettingsClick}
                  >
                    ⚙️
                  </button>
                </div>
              </h3>
              <label class={style.sectionEnabler}>
                Resize
                <Toggle
                  name="resize.enable"
                  checked={!!processorState.resize.enabled}
                  onChange={this.onProcessorEnabledChange}
                />
              </label>
              <Expander>
                {processorState.resize.enabled ? (
                  <ResizeOptionsComponent
                    isVector={Boolean(source && source.vectorImage)}
                    inputWidth={source ? source.preprocessed.width : 1}
                    inputHeight={source ? source.preprocessed.height : 1}
                    options={processorState.resize}
                    onChange={this.onResizeOptionsChange}
                  />
                ) : null}
              </Expander>

              <label class={style.sectionEnabler}>
                Reduce palette
                <Toggle
                  name="quantize.enable"
                  checked={!!processorState.quantize.enabled}
                  onChange={this.onProcessorEnabledChange}
                />
              </label>
              <Expander>
                {processorState.quantize.enabled ? (
                  <QuantOptionsComponent
                    options={processorState.quantize}
                    onChange={this.onQuantizerOptionsChange}
                  />
                ) : null}
              </Expander>
            </div>
          )}
        </Expander>

        <h3 class={style.optionsTitle}>压缩设置</h3>

        <section class={`${style.optionOneCell} ${style.optionsSection}`}>
          <label class={style.optionTextFirst}>
            <span>格式</span>
            <Select
              value={encoderState ? encoderState.type : 'identity'}
              onChange={this.onEncoderTypeChange}
            >
              <option value="identity">原始图片</option>
              {supportedEncoderMap &&
                Object.entries(supportedEncoderMap).map(([name, details]) => (
                  <option key={name} value={name}>
                    {details.meta.label}
                  </option>
                ))}
            </Select>
          </label>
          
          {/* 删除上传提示框，因为现在右边无论什么格式都可以上传 */}
        </section>

        <Expander>
          {EncoderOptionComponent && (
            <EncoderOptionComponent
              options={
                // Casting options, as encoderOptionsComponentMap[encodeData.type] ensures
                // the correct type, but typescript isn't smart enough.
                encoderState!.options as any
              }
              onChange={this.onEncoderOptionsChange}
            />
          )}
        </Expander>
      </div>
    );
  }
}

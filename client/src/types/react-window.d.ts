declare module 'react-window' {
  import * as React from 'react';

  export type ScrollDirection = 'forward' | 'backward';
  export type ScrollToAlign = 'auto' | 'smart' | 'center' | 'start' | 'end';

  export interface ListChildComponentProps {
    index: number;
    style: React.CSSProperties;
    data?: any;
    isScrolling?: boolean;
  }

  export interface GridChildComponentProps {
    columnIndex: number;
    rowIndex: number;
    style: React.CSSProperties;
    data?: any;
    isScrolling?: boolean;
  }

  export interface CommonProps {
    className?: string;
    direction?: 'ltr' | 'rtl';
    itemData?: any;
    layout?: 'horizontal' | 'vertical';
    onItemsRendered?: (props: {
      overscanStartIndex: number;
      overscanStopIndex: number;
      visibleStartIndex: number;
      visibleStopIndex: number;
    }) => void;
    onScroll?: (props: {
      scrollDirection: ScrollDirection;
      scrollOffset: number;
      scrollUpdateWasRequested: boolean;
    }) => void;
    outerRef?: React.Ref<any>;
    style?: React.CSSProperties;
    useIsScrolling?: boolean;
  }

  export interface FixedSizeListProps extends CommonProps {
    children: React.ComponentType<ListChildComponentProps>;
    height: number;
    itemCount: number;
    itemSize: number;
    width: number | string;
    overscanCount?: number;
  }

  export interface VariableSizeListProps extends CommonProps {
    children: React.ComponentType<ListChildComponentProps>;
    height: number;
    itemCount: number;
    itemSize: (index: number) => number;
    width: number | string;
    overscanCount?: number;
  }

  export class FixedSizeList extends React.Component<FixedSizeListProps> {
    scrollTo(scrollOffset: number): void;
    scrollToItem(index: number, align?: ScrollToAlign): void;
  }

  export class VariableSizeList extends React.Component<VariableSizeListProps> {
    scrollTo(scrollOffset: number): void;
    scrollToItem(index: number, align?: ScrollToAlign): void;
    resetAfterIndex(index: number, shouldForceUpdate?: boolean): void;
  }

  export interface FixedSizeGridProps extends CommonProps {
    children: React.ComponentType<GridChildComponentProps>;
    columnCount: number;
    columnWidth: number;
    height: number;
    rowCount: number;
    rowHeight: number;
    width: number;
    overscanColumnCount?: number;
    overscanRowCount?: number;
  }

  export interface VariableSizeGridProps extends CommonProps {
    children: React.ComponentType<GridChildComponentProps>;
    columnCount: number;
    columnWidth: (index: number) => number;
    height: number;
    rowCount: number;
    rowHeight: (index: number) => number;
    width: number;
    overscanColumnCount?: number;
    overscanRowCount?: number;
  }

  export class FixedSizeGrid extends React.Component<FixedSizeGridProps> {
    scrollTo(params: { scrollLeft: number; scrollTop: number }): void;
    scrollToItem(params: {
      align?: ScrollToAlign;
      columnIndex?: number;
      rowIndex?: number;
    }): void;
  }

  export class VariableSizeGrid extends React.Component<VariableSizeGridProps> {
    scrollTo(params: { scrollLeft: number; scrollTop: number }): void;
    scrollToItem(params: {
      align?: ScrollToAlign;
      columnIndex?: number;
      rowIndex?: number;
    }): void;
    resetAfterColumnIndex(index: number, shouldForceUpdate?: boolean): void;
    resetAfterIndices(params: {
      columnIndex: number;
      rowIndex: number;
      shouldForceUpdate?: boolean;
    }): void;
    resetAfterRowIndex(index: number, shouldForceUpdate?: boolean): void;
  }

  export interface ListItemKeySelector {
    (index: number, data: any): React.Key;
  }

  export interface GridItemKeySelector {
    (params: { columnIndex: number; rowIndex: number; data: any }): React.Key;
  }

  export interface areEqual {
    (
      prevProps: Readonly<object>,
      nextProps: Readonly<object>
    ): boolean;
  }

  export function areEqual(
    prevProps: Readonly<object>,
    nextProps: Readonly<object>
  ): boolean;

  export const FixedSizeList: React.ComponentType<FixedSizeListProps>;
  export const VariableSizeList: React.ComponentType<VariableSizeListProps>;
  export const FixedSizeGrid: React.ComponentType<FixedSizeGridProps>;
  export const VariableSizeGrid: React.ComponentType<VariableSizeGridProps>;
}

declare module 'react-virtualized-auto-sizer' {
  import * as React from 'react';

  interface AutoSizerProps {
    children: (size: { width: number; height: number }) => React.ReactNode;
    className?: string;
    defaultHeight?: number;
    defaultWidth?: number;
    disableHeight?: boolean;
    disableWidth?: boolean;
    onResize?: (size: { width: number; height: number }) => void;
    style?: React.CSSProperties;
  }

  export default class AutoSizer extends React.Component<AutoSizerProps> {}
}

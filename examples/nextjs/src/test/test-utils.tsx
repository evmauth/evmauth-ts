import { type RenderOptions, render } from '@testing-library/react';
import type React from 'react';
import type { ReactElement } from 'react';

/**
 * Test context wrapper for providing required contexts to components
 */
interface TestWrapperProps {
    children: React.ReactNode;
}

export function TestWrapper({ children }: TestWrapperProps) {
    return <div data-testid="test-wrapper">{children}</div>;
}

/**
 * Custom render function that wraps components with the required providers
 */
function customRender(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
    return render(ui, { wrapper: TestWrapper, ...options });
}

// Re-export everything from @testing-library/react
export * from '@testing-library/react';

// Override the render method with our custom version
export { customRender as render };

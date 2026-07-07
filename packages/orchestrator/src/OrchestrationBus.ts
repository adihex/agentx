import { EventEmitter } from "node:events";
import { OrchestrationEvent } from "./types";

/**
 * OrchestrationBus
 *
 * A shared event bus for all agents in the orchestration system.
 * In a distributed setup, this would be backed by NATS or Redis.
 */
export class OrchestrationBus extends EventEmitter {
  /** Emit an orchestration event */
  public dispatch(event: OrchestrationEvent): void {
    console.log(`[Bus] 📢 Event: ${event.type}`, "planId" in event ? `(plan=${event.planId})` : "");
    this.emit(event.type, event);
    this.emit("event", event);
    this.emit("*", event);
  }

  /** Subscribe to a specific event type */
  public onEvent<T extends OrchestrationEvent["type"]>(
    type: T,
    handler: (event: Extract<OrchestrationEvent, { type: T }>) => void,
  ): void {
    this.on(type, handler as (...args: any[]) => void);
  }

  /** Subscribe to all events */
  public onAny(handler: (event: OrchestrationEvent) => void): void {
    this.on("event", handler as (...args: any[]) => void);
  }

  public onWildcard(handler: (event: OrchestrationEvent) => void): void {
    this.on("*", handler as (...args: any[]) => void);
  }
}
